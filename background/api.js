import {displayResults} from "./utils.js";
import {REPORT_FETCH_DELAY_MS, VT_API_URLS } from "../const.js";

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

export async function getAnalysisResults(analysisId) {
    const url = VT_API_URLS.GET_ANALYSIS + analysisId;
    console.log('Fetching URL analysis results in a few seconds.')

    try {
        // Wait before fetching the report
        await new Promise(resolve => setTimeout(resolve, REPORT_FETCH_DELAY_MS));

        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'x-apikey': apiKey
            },
        });
        let data = await response.json();
        await displayResults(data);
    } catch (error) {
        console.error('Error:', error);
    }
}
