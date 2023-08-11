import {
    cleaAnalysisIdFromStorage, getAllDomainAnalysisData, getDomainData,
    incrementScannedCounter,
    markDomainAsNotified, replaceDomainAnalysisData,
    setAnalysisIdToStorage,
    setDomainData
} from "./storage.js";
import {MALICIOUS_THRESHOLD, NOTIFICATION_EXPIRY_MS, SCAN_EXPIRY_DURATION_MIN} from "../const.js";

export const extractDomainFromUrl = (url) => {
    const urlObject = new URL(url);
    return urlObject.hostname;
}

// Handles the results of analysis by saving them and alerting the user if necessary
export const saveAndDisplayResults = async (data) => {
    const url = new URL(data.meta.url_info.url);
    const domain = url.hostname;
    const results = data.data.attributes.stats;

    console.log(`Saving ${domain} analysis results to local storage.`)

    // Save the results along with timestamp to local storage
    const currentTime = Date.now();
    await setDomainData(domain, { ...results, timestamp: currentTime });

    // Count total domains scanned and malicious domains
    await incrementScannedCounter('totalScanned');

    // If two or more engines determined the domain to be malicious, notify and increment malicious counter
    if (results.malicious >= MALICIOUS_THRESHOLD) {
        await incrementScannedCounter('maliciousScanned');
        await notifyAboutMaliciousDomain(domain, results);
    }

    // Notify the popup to refresh if it is open
    if (browser.extension.getViews({ type: 'popup' }).length > 0) {
        browser.runtime.sendMessage({ command: 'refreshPopup' });
    }
}

// Checks if notification timeout has expired for a domain and triggers a re-notification in case it did
export const checkIfSavedDomainIsMalicious = async (domain) => {
    const domainData = await getDomainData(domain);
    if (domainData) {
        // Check if the domain is determined to be malicious by two or more engines
        if (domainData.malicious >= MALICIOUS_THRESHOLD) {
            await notifyAboutMaliciousDomain(domain, domainData);
        }
    } else {
        console.warn(`No data found for domain: ${domain}`);
    }
};

export const notifyAboutMaliciousDomain = async (domain, results) => {
    const currentTime = Date.now();
    const lastNotified = results?.lastNotified || 0;

    if (lastNotified === 0 || currentTime - lastNotified > NOTIFICATION_EXPIRY_MS) {
        // Show warning for malicious site
        browser.tabs.create({
            url: `warn/warning.html?domain=${domain}`,
            active: true
        });

        // Update last notified timestamp
        await markDomainAsNotified(domain);
    }
}

export const createAlarmForAnalysisRetrieval = async (analysisId, domain) => {
    // Set an alarm as a backup method to fetch results
    await setAnalysisIdToStorage(analysisId, domain);
    browser.alarms.create(analysisId, { delayInMinutes: 1.0 });
}

// Function to clear alarm data after it's been used
export const clearAlarmForAnalysisRetrieval = async (analysisId) => {
    const existingAlarm = await browser.alarms.get(analysisId);
    if (existingAlarm) {
        browser.alarms.clear(analysisId);
    }

    await cleaAnalysisIdFromStorage(analysisId)
};

export const cleanupOldData = async () => {
    const data = await getAllDomainAnalysisData();
    const now = Date.now();

    for (const domain in data) {
        if (data.hasOwnProperty(domain)) {
            const timestamp = data[domain].timestamp;

            // If the data is older than the expiry duration, delete it
            if (now - timestamp > SCAN_EXPIRY_DURATION_MIN) {
                delete data[domain];
            }
        }
    }

    // Update storage with cleaned data
    await replaceDomainAnalysisData(data);
}
