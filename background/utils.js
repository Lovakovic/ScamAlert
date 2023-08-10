import {
    cleaAlarmDataFromStorage,
    incrementScannedCounter,
    markDomainAsNotified,
    setAlarmData,
    setDomainData
} from "./storage.js";
import {NOTIFICATION_EXPIRY} from "../const.js";

export const extractDomainFromUrl = (url) => {
    const urlObject = new URL(url);
    return urlObject.hostname;
}

// Function to handle the results
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
    if (results.malicious >= 2) {
        await incrementScannedCounter('maliciousScanned');
        await notifyAboutMaliciousDomain(domain, results);
    }

    // Notify the popup to refresh if it is open
    if (browser.extension.getViews({ type: 'popup' }).length > 0) {
        browser.runtime.sendMessage({ command: 'refreshPopup' });
    }
}

export const notifyAboutMaliciousDomain = async (domain, results) => {
    const currentTime = Date.now();
    const lastNotified = results?.lastNotified || 0;

    if (lastNotified === 0 || currentTime - lastNotified > NOTIFICATION_EXPIRY) {
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
    await setAlarmData(analysisId, domain);
    browser.alarms.create(analysisId, { delayInMinutes: 1.0 });
}

// Function to clear alarm data after it's been used
export const clearAlarmData = async (analysisId) => {
    const existingAlarm = await browser.alarms.get(analysisId);
    if (existingAlarm) {
        browser.alarms.clear(analysisId);
    }

    await cleaAlarmDataFromStorage(analysisId)
};
