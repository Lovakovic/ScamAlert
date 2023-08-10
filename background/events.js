// Monitor tab updates to check when a new URL is loaded
import { handleTabUpdated, fetchResultsWithRetries} from "./domain.service.js";
import { getDomainByAnalysisId } from "./storage.js";
import { manageScanTimeoutsForDomain } from "./timeout.service.js";
import {refreshPopup} from "../popup/popup.js";

export const onTabUpdated = async (tabId, changeInfo, tab) => {
    await handleTabUpdated(tabId, changeInfo, tab);
}

// Display setup after extension is installed
export const onExtensionInstalled = async (details) => {
    if (details.reason === "install") {
        // Open the welcome setup page when the extension is installed
        browser.tabs.create({ url: '../setup/welcome.html' });
    }
}

// TODO: Implement a check whether the entered API key is valid
// Close the setup on `close` button click
export const onMessageReceived = async (request) => {
    if(request.command === 'refreshPopup') {
        await refreshPopup()
        return;
    }

    if (request.command === "closeSetupTab") {
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            browser.tabs.remove(tabs[0].id);
        });
    }
}

// Fetches the analysis results for domain with an ID in alarm name
export const onAlarmReceived = async (alarm) => {
    const domain = await getDomainByAnalysisId(alarm.name);
    if (domain) {
        await fetchResultsWithRetries(alarm.name, domain);
    }
}

// Removes the timeout for posting a URL for analysis
export const onTabRemoved = async (tabId) => {
    manageScanTimeoutsForDomain(tabId);
}
