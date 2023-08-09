import {getAnalysisResults, postUrl} from "./api.js";
import {
    cleanupAnalysisIds, clearAlarmForDomain,
    clearPendingAnalysisForDomain,
    displayResults,
    isDomainPendingAnalysis,
    markDomainAsPendingAnalysis,
    notifyIfDomainIsMalicious,
    setAlarmForDomain,
    setRetryAlarmForAnalysis
} from "./utils.js";
import {POST_URL_TIMEOUT_MS, REPORT_FETCH_MAX_RETRIES} from "../const.js";

const tabTimeouts = {};

export async function processUrlForDomain(domain) {
    if (tabTimeouts[domain]) {
        clearTimeout(tabTimeouts[domain]);
        await clearAlarmForDomain(domain);
    }

    let domainData = await browser.storage.local.get(domain);

    if (Object.keys(domainData).length !== 0 && domainData.constructor === Object) {
        await notifyIfDomainIsMalicious(domain, domainData[domain]);
    } else {
        const isPending = await isDomainPendingAnalysis(domain);
        if (!isPending) {
            setTimeout(async () => {
                try {
                    await markDomainAsPendingAnalysis(domain);
                    const analysisId = await postUrl(domain);
                    if (analysisId) {
                        await setAlarmForDomain(tabId, 1, analysisId);
                    }
                    await clearPendingAnalysisForDomain(domain);

                } catch (error) {
                    console.warn('Error during URL posting:', error.message);
                    await clearPendingAnalysisForDomain(domain);
                }
            }, POST_URL_TIMEOUT_MS);
        }
    }

    tabDomains[tabId] = domain;
}

export async function processUrlForAnalysis(tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete') {
        return;
    }

    let url = new URL(tab.url);
    let domain = url.hostname;

    if (!url.protocol.startsWith('http')) {
        console.log(`Ignoring URL with non-HTTP protocol: ${url.href}`);
        return;
    }

    await processUrlForDomain(domain);
}


export async function handleAlarmForAnalysisRetrieval(domain) {
    const analysisIdData = await browser.storage.local.get(`analysisId-${domain}`);
    const analysisId = analysisIdData[`analysisId-${domain}`];

    if (!analysisId) {
        console.error(`No analysisId found for tab ID ${domain}.`);
        return;
    }

    try {
        const data = await getAnalysisResults(analysisId);
        if (data) {
            await displayResults(data);
            await cleanupAnalysisIds(domain);
        } else {
            const retryData = await browser.storage.local.get(`retryCount-${domain}`);
            let retryCount = (retryData[`retryCount-${domain}`] || 0) + 1;

            if (retryCount <= REPORT_FETCH_MAX_RETRIES) {
                await browser.storage.local.set({ [`retryCount-${domain}`]: retryCount });
                await setRetryAlarmForAnalysis(domain, retryCount);
            } else {
                console.error("Max retries reached. Analysis is not ready.");
                await cleanupAnalysisIds(domain);
            }
        }
    } catch (error) {
        console.error('Error during handling analysis results:', error.message);
    }
}

export async function removeDomainFromTracking(domain) {
    if (tabTimeouts[domain]) {
        clearTimeout(tabTimeouts[domain]);
    }
    await clearAlarmForDomain(domain);
    delete tabTimeouts[domain];
}
