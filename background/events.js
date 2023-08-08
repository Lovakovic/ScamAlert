import { processUrlForAnalysis, removeTabFromTracking } from './service.js';

// Monitor tab updates to check when a new URL is loaded
export async function onTabUpdated(tabId, changeInfo, tab) {
    await processUrlForAnalysis(tabId, changeInfo, tab);
}

// Handle tab removal - cancel timeout for domain whose tab was closed
export function onTabRemoved(tabId) {
    removeTabFromTracking(tabId);
}

// Display setup after extension is installed
export function onExtensionInstalled(details) {
    if (details.reason === "install") {
        browser.tabs.create({ url: "../setup/welcome.html" });
    }
}

// Close the setup on `close` button click
export function onMessageReceived(request) {
    if (request.command === "closeSetupTab") {
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            browser.tabs.remove(tabs[0].id);
        });
    }
}
