import {fetchResultsWithRetries, handleTabUpdated} from "../background/domain.service.js";
import {getDomainByAnalysisId} from "./storage.js";
import {manageScanTimeoutsForDomain} from "../background/timeout.service.js";
import {cleanupOldData} from "./utils.js";
import {CLEANUP_INTERVAL_MIN} from "../const.js";

// Monitor tab updates to check when a new URL is loaded
export const onTabUpdated = async (tabId, changeInfo, tab) => {
    await handleTabUpdated(tabId, changeInfo, tab);
}

// Display setup after extension is installed
export const onExtensionInstalled = async (details) => {
    if (details.reason === "install") {
        // Open the welcome setup page when the extension is installed
        browser.tabs.create({ url: '../setup/welcome.html' });

        // Recurring alarm which will trigger stale analysis data cleanup
        browser.alarms.create('cleanupAlarm', { periodInMinutes: CLEANUP_INTERVAL_MIN })
    }
}

// TODO: Implement a check whether the entered API key is valid
export const onMessageReceived = async (request) => {
    if (request.command === 'closeSetupTab') {
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            browser.tabs.remove(tabs[0].id);
        });
    }
}

// Fetches the analysis results for domain with an ID in alarm name
export const onAlarmReceived = async (alarm) => {
    if (alarm.name === 'cleanupAlarm') {
        await cleanupOldData();
        return;
    }

    const domain = await getDomainByAnalysisId(alarm.name);
    if (domain) {
        await fetchResultsWithRetries(alarm.name, domain);
    }
}

// Removes the timeout for posting a URL for analysis
export const onTabRemoved = async (tabId) => {
    manageScanTimeoutsForDomain(tabId);
}
