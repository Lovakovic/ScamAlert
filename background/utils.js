import {NOTIFICATION_EXPIRY, SCAN_EXPIRY_DURATION} from "../const.js";

export async function notifyIfDomainIsMalicious(domain, results) {
    const currentTime = Date.now();

    let lastNotified = results?.lastNotified || 0;

    if (results.malicious >= 2 && (lastNotified === 0 || currentTime - lastNotified > NOTIFICATION_EXPIRY)) {
        // Show warning for malicious site
        browser.tabs.create({
            url: `warn/warning.html?domain=${domain}`,
            active: true
        });

        // Update last notified timestamp
        await browser.storage.local.set({ [domain]: { ...results, lastNotified: currentTime } });
    }
}

export async function displayResults(data) {
    let url = new URL(data.meta.url_info.url);
    let domain = url.hostname;
    let results = data.data.attributes.stats;

    console.log(`Saving ${domain} analysis results to local storage.`)

    // Save the results along with timestamp to local storage
    const currentTime = Date.now();
    await browser.storage.local.set({[domain]: {...results, timestamp: currentTime}});

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

    // If two or more engines determined the domain to be malicious, notify
    if (results.malicious >= 2) {
        malicious.maliciousScanned += 1;
    }

    // Use the notifyMaliciousDomain function
    await notifyIfDomainIsMalicious(domain, results);

    // Save updated stats to local storage
    await browser.storage.local.set({totalScanned: total.totalScanned});
    await browser.storage.local.set({maliciousScanned: malicious.maliciousScanned});

    // Notify the popup to refresh if it is open
    if (browser.extension.getViews({type: 'popup'}).length > 0) {
        browser.runtime.sendMessage({command: 'refreshPopup'});
    }
}

export async function cleanupExpiredScans() {
    let storageData = await browser.storage.local.get();
    console.log('Cleaning up stale analysis results.')

    for (let domain in storageData) {
        if (storageData[domain].timestamp && (Date.now() - storageData[domain].timestamp) > SCAN_EXPIRY_DURATION) {
            console.log(`Removing expired scan for domain: ${domain}`);
            await browser.storage.local.remove(domain);
        }
    }
}

export async function cleanupAnalysisIds(domain) {
    await browser.storage.local.remove(`analysisId-${domain}`);
    await browser.storage.local.remove(`retryCount-${domain}`);
}

export async function setAlarmForDomain(domain, delayInMinutes, analysisId) {
    const alarmName = `analysis-${domain}`;
    await browser.alarms.create(alarmName, { delayInMinutes });
    await browser.storage.local.set({
        [alarmName]: domain,
        [`analysisId-${domain}`]: analysisId
    });
}

export async function clearAlarmForDomain(domain) {
    const alarmName = `analysis-${domain}`;
    await browser.alarms.clear(alarmName);
    await browser.storage.local.remove(alarmName);
    await browser.storage.local.remove(`analysisId-${domain}`);
}

export async function setRetryAlarmForAnalysis(domain, retryCount) {
    const alarmName = `retry-analysis-${domain}-${retryCount}`;
    const delayInMinutes = Math.pow(2, retryCount);
    await browser.alarms.create(alarmName, { delayInMinutes });
}

export async function markDomainAsPendingAnalysis(domain) {
    await browser.storage.local.set({ [`pending-${domain}`]: true });
}

export async function clearPendingAnalysisForDomain(domain) {
    await browser.storage.local.remove(`pending-${domain}`);
}

export async function isDomainPendingAnalysis(domain) {
    const data = await browser.storage.local.get(`pending-${domain}`);
    return data.hasOwnProperty(`pending-${domain}`);
}
