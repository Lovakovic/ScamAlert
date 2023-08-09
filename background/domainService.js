import {getAnalysisResults, postUrl} from './api.js';
import {
    clearAlarmData,
    hasDomainBeenScanned,
    isDomainPendingScan,
    markDomainAsPending,
    removeDomainFromPending, setAlarmData
} from "./storage.js";
import {POST_URL_TIMEOUT_MS, REPORT_FETCH_DELAY_MS} from "../const.js";
import {displayResults, extractDomainFromUrl} from "./utils.js";

const tabTimeouts = {};

export const handleTabUpdated = async (tabId, changeInfo, tab) => {
    // Ignore the tab if it's not in a complete state or doesn't have a URL
    if (changeInfo.status !== 'complete') return;

    // Don't scan non-HTTP URL
    const url = new URL(tab.url);
    console.log('url:', url)
    if (!url.protocol.startsWith('http')) {
        console.log(`Ignoring URL with non-HTTP protocol: ${url.href}`);
        return;
    }

    clearTabTimeout(tabId);

    const domain = extractDomainFromUrl(url);

    // Check if domain has already been scanned
    const isScanned = await hasDomainBeenScanned(domain);
    console.log('Domain has already been scanned:', isScanned)
    if (isScanned) return;

    // Check if the domain already has a pending scan
    const isPendingScan = await isDomainPendingScan(domain);
    if (isPendingScan) return;

    // Delay the POST request to not spam the API
    const timeoutId = setTimeout(async () => {
        const analysisId = await postUrl(domain);

        // Mark domain as pending for analysis results
        await markDomainAsPending(domain, analysisId);

        // Set an alarm for one minute to check the analysis results
        browser.alarms.create(analysisId, { delayInMinutes: 1 });

        // Try to fetch the results with a timout, this might fail
        onAnalysisIdReceived(domain, analysisId);
    }, POST_URL_TIMEOUT_MS);

    tabTimeouts[tabId] = {
        domain: domain,
        timeoutId: timeoutId
    };
}

// Fetch results by analysis ID and perform necessary cleanup
export const fetchResults = async (analysisId, domain) => {
    try {
        const data = await getAnalysisResults(analysisId);
        await displayResults(data);

        // Cleanup
        await removeDomainFromPending(domain);
        browser.alarms.clear(analysisId);
        await clearAlarmData(analysisId);
    } catch (error) {
        console.error("Error fetching results: ", error);
    }
}

// When an analysis ID is received after posting URL
const onAnalysisIdReceived = (domain, analysisId) => {
    // Set timeout for fetching results
    setTimeout(() => {
        fetchResults(analysisId, domain)
            .then(() => {
                console.log('Results for', domain, 'fetched successfully');
            })
            .catch((error) => {
                console.error('Error fetching results for', domain, ':', error);
            });
    }, REPORT_FETCH_DELAY_MS);

    // Set an alarm as a backup method to fetch results
    setAlarmData(analysisId, domain)
        .then(() => {
            console.log('Alarm data for', domain, 'set successfully');
        })
        .catch((error) => {
            console.error('Error setting alarm data: ', error);
        });

    browser.alarms.create(analysisId, { delayInMinutes: 1.0 });
}

// Clears an existing timeout by tabId
export const clearTabTimeout = (tabId) => {
    const previousDomain = tabTimeouts[tabId];
    if (previousDomain?.timeoutId) {
        clearTimeout(previousDomain.timeoutId);
        delete tabTimeouts[tabId];
    }
};
