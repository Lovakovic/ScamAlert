import {displayResults} from "./utils.js";
import {REPORT_FETCH_DELAY_MS, REPORT_FETCH_MAX_RETRIES, VT_API_URLS} from "../const.js";

let apiKey = '';

async function getApiKey() {
    let result = await browser.storage.local.get('apiKey');
    return result.apiKey || '';
}

export async function postUrl(url) {
    apiKey = await getApiKey();
    if (!apiKey) {
        console.log("No API key is provided so URL couldn't be scanned.");
        return;
    }
    const encodedParams = new URLSearchParams();
    encodedParams.set('url', url);
    console.log(`Posting URL ${url} to VT.`)
    try {
        let response = await fetch(VT_API_URLS.POST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-apikey': apiKey,
                'accept': 'application/json'
            },
            body: encodedParams
        });
        let data = await response.json();
        const id = data.data.id;
        await getAnalysisResults(id);
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getAnalysisResults(analysisId, retryCount = 0) {
    const url = VT_API_URLS.GET_ANALYSIS + analysisId;

    if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, REPORT_FETCH_DELAY_MS));
    }

    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'x-apikey': apiKey
            },
        });

        let data = await response.json();

        if (data.data.attributes.status === "completed") {
            await displayResults(data);
        } else {
            if (retryCount < REPORT_FETCH_MAX_RETRIES) {
                console.log(`Analysis not ready. Retrying in ${Math.pow(2, retryCount) * REPORT_FETCH_DELAY_MS / 1000} seconds...`);

                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * REPORT_FETCH_DELAY_MS));
                await getAnalysisResults(analysisId, retryCount + 1);
            } else {
                console.error("Max retries reached. Analysis is not ready.");
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
