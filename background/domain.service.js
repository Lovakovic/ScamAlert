import {getAnalysisResults, postUrl} from './api.js';
import {
    getRetryCount,
    hasDomainBeenScanned, increaseRetryCount,
    isDomainPendingScanResults,
    markDomainAsPendingResults,
    removeDomainFromPending
} from "./storage.js";
import {POST_URL_TIMEOUT_MS, REPORT_FETCH_DELAY_MS, REPORT_FETCH_MAX_RETRIES} from "../const.js";
import {
    clearAlarmData,
    createAlarmForAnalysisRetrieval,
    saveAndDisplayResults,
    extractDomainFromUrl, checkIfSavedDomainIsMalicious
} from "./utils.js";
import {
    manageScanTimeoutsForDomain,
    isDomainPendingImmediatePost,
    markDomainAsPendingImmediatePost,
    setTabTimeout
} from "./timeout.service.js";

export const handleTabUpdated = async (tabId, changeInfo, tab) => {
    // Ignore the tab if it's not in a complete state or doesn't have a URL
    if (changeInfo.status !== 'complete') return;

    // Don't scan non-HTTP URL
    const url = new URL(tab.url);
    if (!url.protocol.startsWith('http')) {
        console.log(`Ignoring URL with non-HTTP protocol: ${url.href}`);
        return;
    }

    const domain = extractDomainFromUrl(url);
    manageScanTimeoutsForDomain(tabId, domain);

    const isScanned = await hasDomainBeenScanned(domain);
    if (isScanned){
        // Check if we need to re-notify the user
        await checkIfSavedDomainIsMalicious(domain);
        return;
    }

    // Check if the domain is in the immediate pending list
    if (isDomainPendingImmediatePost(domain)) return;

    // Check if the domain already has a pending scan
    const isPendingScan = await isDomainPendingScanResults(domain);
    if (isPendingScan) return;

    // Mark the domain as pending in the immediate list
    markDomainAsPendingImmediatePost(domain);

    // Delay the POST request to not spam the API
    await setTabTimeout(tabId, domain, async () => {
        const analysisId = await postUrl(domain);

        // Update the analysisId for the domain in the pending list
        await markDomainAsPendingResults(domain, analysisId);

        // Set an alarm for one minute to check the analysis results
        browser.alarms.create(analysisId, { delayInMinutes: 1.0 });

        // Try to fetch the results with a timeout, this might fail
        await onAnalysisIdReceived(domain, analysisId);
    }, POST_URL_TIMEOUT_MS);

}

// Wrapper function for `fetchResults` which implements retry logic if results aren't ready
export const fetchResultsWithRetries = async (analysisId, domain) => {
    const retryCount = await getRetryCount(analysisId);
    try {
        await fetchResults(analysisId, domain);
    } catch (error) {
        if (error.message === "ResultsNotReady") {
            if (retryCount < REPORT_FETCH_MAX_RETRIES) {
                await increaseRetryCount(analysisId);
                const backoffTime = retryCount + 1;
                browser.alarms.create(analysisId, { delayInMinutes: backoffTime });
            } else {
                console.error("Max retries reached for", domain);
                await removeDomainFromPending(domain);
                await clearAlarmData(analysisId);
            }
        } else {
            console.error("Error fetching results: ", error);
        }
    }
};

// Fetch results by analysis ID and perform necessary cleanup
export const fetchResults = async (analysisId, domain) => {
    const data = await getAnalysisResults(analysisId);
    if (!data) {
        throw new Error("ResultsNotReady");
    }
    await saveAndDisplayResults(data);

    // Cleanup
    await removeDomainFromPending(domain);
    await clearAlarmData(analysisId);
};

// Sets a timeout for analysis results retrieval, as well as an alarm which will wake the script up if it gets unmounted
const onAnalysisIdReceived = async (domain, analysisId) => {
    // Set timeout for fetching results, this might not fire
    setTimeout(() => {
        fetchResults(analysisId, domain)
            .catch(error => console.error('Error fetching results for', domain, ':', error));
    }, REPORT_FETCH_DELAY_MS);

    createAlarmForAnalysisRetrieval(analysisId, domain)
        .catch(error => console.error('Error setting alarm data:', error));
};
