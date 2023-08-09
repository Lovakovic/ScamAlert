import {REPORT_FETCH_DELAY_MS, VT_API_URLS} from "../const.js";

let apiKey = '';

const ensureApiKey = async () => {
    let result = await browser.storage.local.get('apiKey');
    apiKey = result.apiKey || '';
    if (!apiKey) {
        throw new Error("API key is not available.");
    }
}

export const postUrl = async (url) => {
    await ensureApiKey();

    const encodedParams = new URLSearchParams();
    encodedParams.set('url', url);

    const response = await fetch(VT_API_URLS.POST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-apikey': apiKey,
            'accept': 'application/json'
        },
        body: encodedParams
    });

    console.log('Analyzing', url)
    const data = await response.json();
    return data.data.id;
}

export const getAnalysisResults = async (analysisId) => {
    await ensureApiKey();
    const url = VT_API_URLS.GET_ANALYSIS + analysisId;
    await new Promise(resolve => setTimeout(resolve, REPORT_FETCH_DELAY_MS));
    let response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'x-apikey': apiKey
        }
    });
    let data = await response.json();

    if (data.data.attributes.status === "completed") {
        return data;
    } else {
        console.log('Analysis results aren\'t ready, scheduling a retry.')
        return null;
    }
}

/**
 * Fetches the quota summary for the user and returns the relevant details.
 * @returns {Object} Quota details of interest.
 */
export async function getQuotaSummary() {
    await ensureApiKey();

    const url = `${VT_API_URLS.GET_QUOTAS}${apiKey}/overall_quotas`;

    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'x-apikey': apiKey
            },
        });

        if (response.status !== 200) {
            throw new Error(`API returned status: ${response.status}`);
        }

        let data = await response.json();

        const quotaData = data.data;

        // Filtering out non-API related quotas and those with zeroes.
        const relevantQuotas = ['api_requests_monthly', 'api_requests_hourly', 'api_requests_daily'];

        const summary = {};

        for (const quotaKey of relevantQuotas) {
            const quotaInfo = quotaData[quotaKey].user;

            if (quotaInfo.used !== 0 || quotaInfo.allowed !== 0) {
                summary[quotaKey] = quotaInfo;
            }
        }

        return summary;
    } catch (error) {
        console.error('Error fetching quota:', error);
        throw error;
    }
}
