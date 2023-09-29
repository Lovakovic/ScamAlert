import {getAnalysisResults, postUrl, ResultsNotReadyError} from '../modules/api.js';
import {
    getRetryCount,
    hasDomainBeenScanned,
    increaseRetryCount,
    isDomainPendingScanResults,
    markDomainAsPendingResults,
    removeDomainFromPending
} from "../modules/storage.js";
import {POST_URL_TIMEOUT_MS, REPORT_FETCH_DELAY_MS, REPORT_FETCH_MAX_RETRIES} from "../const.js";
import {
    checkIfSavedDomainIsMalicious,
    clearAlarmForAnalysisRetrieval,
    createAlarmForAnalysisRetrieval,
    extractDomainFromUrl,
    refreshPopupIfOpen,
    saveAndDisplayResults, shouldSkipUrlScan
} from "../modules/utils.js";
import {
    isDomainPendingImmediatePost,
    manageScanTimeoutsForDomain,
    markDomainAsPendingImmediatePost,
    removeDomainFromPendingImmediatePost,
    setTabTimeout
} from "./timeout.service.js";

export const handleTabUpdated = async (tabId, changeInfo, tab) => {
    // Firstly refresh to represent current state of the site
    refreshPopupIfOpen()

    if (!tab.url || typeof tab.url !== 'string') return;

    const url = new URL(tab.url);

    // Don't scan URLs which aren't public
    if (shouldSkipUrlScan(url)) return;

    const domain = extractDomainFromUrl(url);

    // This makes sure that refreshing tab or opening multiple tabs in same domain work as
    // expected and send only one URL for a scan
    manageScanTimeoutsForDomain(tabId, domain);

    const isScanned = await hasDomainBeenScanned(domain);
    if (isScanned){
        // Renotify the user in case the domain is malicious and re-notification period expired
        await checkIfSavedDomainIsMalicious(domain);
        return;
    }

    // This prevents setting the timeout twice for the same domain in case tab is refreshed
    // before the first timeout for that domain had a chance to POST the URL
    if (isDomainPendingImmediatePost(domain)) return;

    // This prevents setting the timeout for a domain that's already been posted for a scan and is pending results
    const isPendingResults = await isDomainPendingScanResults(domain);
    if (isPendingResults) return;

    markDomainAsPendingImmediatePost(domain);

    // Delay the POST request to not spam the API
    await setTabTimeout(tabId, domain, async () => {
        try {
            const analysisId = await postUrl(domain);

            // Update the analysisId for the domain in the pending list
            await markDomainAsPendingResults(domain, analysisId);

            // Make sure to fetch analysis results later
            await onAnalysisIdReceived(domain, analysisId);
        } catch (e) {
            console.error(e);
            // We didn't get the analysis ID, can't fetch the report
            removeDomainFromPendingImmediatePost(domain);
        }
    }, POST_URL_TIMEOUT_MS);
}

// Wrapper function for `fetchResults` which implements retry logic if results aren't ready
export const fetchResultsWithRetries = async (analysisId, domain) => {
    const retryCount = await getRetryCount(analysisId);
    try {
        await fetchResults(analysisId, domain);
    } catch (error) {
        if (error instanceof ResultsNotReadyError) {
            if (retryCount < REPORT_FETCH_MAX_RETRIES) {
                await increaseRetryCount(analysisId);
                const backoffTime = retryCount + 1;
                chrome.alarms.create(analysisId, { delayInMinutes: backoffTime });  // Changed browser to chrome
            } else {
                console.error("Max retries reached for", domain);
                await removeDomainFromPending(domain);
                await clearAlarmForAnalysisRetrieval(analysisId);
            }
        } else {
            console.error("Error fetching results: ", error);
            await removeDomainFromPending(domain);
            await clearAlarmForAnalysisRetrieval(analysisId);
        }
    }
};

// Fetch results by analysis ID and perform necessary cleanup
export const fetchResults = async (analysisId, domain) => {
    const data = await getAnalysisResults(analysisId);

    await removeDomainFromPending(domain);
    await clearAlarmForAnalysisRetrieval(analysisId);

    await saveAndDisplayResults(data);
};


// Sets a timeout for analysis results retrieval, as well as an alarm which will wake the script up if it gets unmounted
const onAnalysisIdReceived = async (domain, analysisId) => {
    // Set timeout for fetching results, this might not fire
    setTimeout(() => {
        fetchResults(analysisId, domain)
            .catch(async error => {
               if(!(error instanceof ResultsNotReadyError)) {
                   console.error('Error fetching results for', domain, ':', error);
                   await removeDomainFromPending(domain);
                   await clearAlarmForAnalysisRetrieval(analysisId);
               }
            });
    }, REPORT_FETCH_DELAY_MS);

    createAlarmForAnalysisRetrieval(analysisId, domain)
        .catch(error => console.error('Error setting alarm data:', error));
};
