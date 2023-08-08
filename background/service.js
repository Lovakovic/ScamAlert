import { postUrl, getAnalysisResults } from "./api.js";
import { notifyIfDomainIsMalicious, displayResults } from "./utils.js";
import { POST_URL_TIMEOUT_MS } from "../const.js";

const tabTimeouts = {};
const tabDomains = {};

export async function processUrlForAnalysis(tabId, changeInfo, tab) {
    if(changeInfo.status !== 'complete') {
        return;
    }

    let url = new URL(tab.url);
    let domain = url.hostname;

    if (!url.protocol.startsWith('http')) {
        console.log(`Ignoring URL with non-HTTP protocol: ${url.href}`);
        return;
    }

    if (tabDomains[tabId] !== domain) {
        if (tabTimeouts[tabId]) {
            clearTimeout(tabTimeouts[tabId]);
        }

        let domainData = await browser.storage.local.get(domain);

        if (Object.keys(domainData).length !== 0 && domainData.constructor === Object) {
            await notifyIfDomainIsMalicious(domain, domainData[domain]);
        } else {
            tabTimeouts[tabId] = setTimeout(async () => {
                try {
                    const analysisId = await postUrl(domain);
                    if (analysisId) {
                        await getAndHandleAnalysisResults(analysisId);
                    }
                } catch (error) {
                    console.error('Error during URL posting or handling analysis results:', error.message);
                }
            }, POST_URL_TIMEOUT_MS);
        }

        tabDomains[tabId] = domain;
    }
}

export function removeTabFromTracking(tabId) {
    if (tabTimeouts[tabId]) {
        clearTimeout(tabTimeouts[tabId]);
    }
    delete tabTimeouts[tabId];
    delete tabDomains[tabId];
}

async function getAndHandleAnalysisResults(analysisId) {
    try {
        const data = await getAnalysisResults(analysisId);
        if (data) {
            await displayResults(data);
        }
    } catch (error) {
        console.error('Error during analysis result fetching or displaying results:', error.message);
    }
}
