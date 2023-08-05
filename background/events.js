import { postUrl } from './api.js';

const POST_URL_TIMEOUT_MS = 10000;
const tabTimeouts = {};
const tabDomains = {};

// Monitor tab updates to check when a new URL is loaded
export async function onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        // Get the domain from the URL
        let url = new URL(tab.url);
        let domain = url.hostname;

        if (!url.protocol.startsWith('http')) {
            console.log(`Ignoring URL with non-HTTP protocol: ${url.href}`);
            await browser.storage.local.set({[domain]: {nonHTTP: true}});
            return;
        }

        // If the domain has changed, reset the timeout
        if (tabDomains[tabId] !== domain) {
            // Cancel previous timeout if it exists
            if (tabTimeouts[tabId]) {
                clearTimeout(tabTimeouts[tabId]);
            }
            // Set a new timeout for the current tab
            tabTimeouts[tabId] = setTimeout(async () => {
                // Check if domain is in local storage
                let result = await browser.storage.local.get(domain);

                if (Object.keys(result).length === 0 && result.constructor === Object) {
                    // If not in storage, post the domain for analysis
                    await postUrl(domain);
                }
            }, POST_URL_TIMEOUT_MS);

            // Save the new domain
            tabDomains[tabId] = domain;
        }
    }
}

// Handle tab removal - cancel timeout for domain whose tab was closed
export function onTabRemoved(tabId) {
    // If there is a timeout set for the tab, clear it
    if (tabTimeouts[tabId]) {
        clearTimeout(tabTimeouts[tabId]);
    }
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
