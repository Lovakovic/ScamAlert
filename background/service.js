import {getAnalysisResults, postUrl} from "./api.js";
import {displayResults, notifyIfDomainIsMalicious} from "./utils.js";
import {REPORT_FETCH_DELAY_MS, REPORT_FETCH_MAX_RETRIES} from "../const.js";

const tabTimeouts = {};
const tabDomains = {};

async function setAlarmForTab(tabId, delayInMinutes, analysisId) {
    const alarmName = `analysis-${tabId}`;
    await browser.alarms.create(alarmName, { delayInMinutes });
    await browser.storage.local.set({
        [alarmName]: tabId,
        [`analysisId-${tabId}`]: analysisId
    });
}

async function clearAlarmForTab(tabId) {
    const alarmName = `analysis-${tabId}`;
    await browser.alarms.clear(alarmName);
    await browser.storage.local.remove(alarmName);
    await browser.storage.local.remove(`analysisId-${tabId}`);
}

async function setRetryAlarmForAnalysis(tabId, retryCount) {
    const alarmName = `retry-analysis-${tabId}-${retryCount}`;
    const delayInMinutes = Math.pow(2, retryCount);
    await browser.alarms.create(alarmName, { delayInMinutes });
}

export async function processUrlForDomain(tabId, domain) {
    if (tabDomains[tabId] !== domain) {
        if (tabTimeouts[tabId]) {
            clearTimeout(tabTimeouts[tabId]);
            await clearAlarmForTab(tabId);
        }

        let domainData = await browser.storage.local.get(domain);

        if (Object.keys(domainData).length !== 0 && domainData.constructor === Object) {
            await notifyIfDomainIsMalicious(domain, domainData[domain]);
        } else {
            setTimeout(async () => {
                try {
                    const analysisId = await postUrl(domain);
                    if (analysisId) {
                        await setAlarmForTab(tabId, 1, analysisId);
                    }
                } catch (error) {
                    console.error('Error during URL posting:', error.message);
                }
            }, REPORT_FETCH_DELAY_MS);
        }

        tabDomains[tabId] = domain;
    }
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

    await processUrlForDomain(tabId, domain);
}


export async function handleAlarmForAnalysis(tabId) {
    const analysisIdData = await browser.storage.local.get(`analysisId-${tabId}`);
    const analysisId = analysisIdData[`analysisId-${tabId}`];

    if (!analysisId) {
        console.error(`No analysisId found for tab ID ${tabId}.`);
        return;
    }

    try {
        const data = await getAnalysisResults(analysisId);
        if (data) {
            await displayResults(data);
        } else {
            const retryData = await browser.storage.local.get(`retryCount-${tabId}`);
            let retryCount = (retryData[`retryCount-${tabId}`] || 0) + 1;

            if (retryCount <= REPORT_FETCH_MAX_RETRIES) {
                await browser.storage.local.set({ [`retryCount-${tabId}`]: retryCount });
                await setRetryAlarmForAnalysis(tabId, retryCount);
            } else {
                console.error("Max retries reached. Analysis is not ready.");
            }
        }
    } catch (error) {
        console.error('Error during handling analysis results:', error.message);
    }
}

export async function removeTabFromTracking(tabId) {
    if (tabTimeouts[tabId]) {
        clearTimeout(tabTimeouts[tabId]);
    }
    await clearAlarmForTab(tabId);
    delete tabTimeouts[tabId];
    delete tabDomains[tabId];
}
