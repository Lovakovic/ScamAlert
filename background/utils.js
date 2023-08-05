export async function displayResults(data) {
    let url = new URL(data.meta.url_info.url);
    let domain = url.hostname;
    let results = data.data.attributes.stats;

    console.log('Saving analysis results to local storage.')
    // Save the results to local storage
    await browser.storage.local.set({[domain]: results});

    // Count total domains scanned and malicious domains
    let total = await browser.storage.local.get('totalScanned');
    let malicious = await browser.storage.local.get('maliciousScanned');

    if (!total.totalScanned) {
        total.totalScanned = 0;
    }
    if (!malicious.maliciousScanned) {
        malicious.maliciousScanned = 0;
    }

    total.totalScanned += 1;

    // If two or more engines determined the domain to be malicious, show warning
    if (results.malicious >= 2) {
        malicious.maliciousScanned += 1;

        // Open the warning page
        browser.tabs.create({
            url: `warn/warning.html?domain=${domain}`,
            active: true
        });
    }

    // Save updated stats to local storage
    await browser.storage.local.set({totalScanned: total.totalScanned});
    await browser.storage.local.set({maliciousScanned: malicious.maliciousScanned});

    // Notify the popup to refresh if it is open
    if (browser.extension.getViews({type: 'popup'}).length > 0) {
        browser.runtime.sendMessage({command: 'refreshPopup'});
    }
}
