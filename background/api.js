import { VT_API_URLS, REPORT_FETCH_DELAY_MS, REPORT_FETCH_MAX_RETRIES } from "../const.js";

let apiKey = '';

async function getApiKey() {
    let result = await browser.storage.local.get('apiKey');
    return result.apiKey || '';
}

export async function postUrl(url) {
    apiKey = await getApiKey();
    if (!apiKey) {
        console.log("No API key is provided so URL couldn't be scanned.");
        return null;
    }

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

    console.log('Analyzing ', url)
    const data = await response.json();
    return data.data.id;
}

export async function getAnalysisResults(analysisId, retryCount = 0) {
    const url = VT_API_URLS.GET_ANALYSIS + analysisId;

    if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, REPORT_FETCH_DELAY_MS));
    }

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
        if (retryCount < REPORT_FETCH_MAX_RETRIES) {
            console.log('Analysis results aren\'t ready, retrying soon.')
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * REPORT_FETCH_DELAY_MS));
            return await getAnalysisResults(analysisId, retryCount + 1);
        } else {
            console.error("Max retries reached. Analysis is not ready.");
            return null;
        }
    }
}

/**
     * Fetches the quota summary for the user and returns the relevant details.
     * @returns {Object} Quota details of interest.
     */
export async function getQuotaSummary() {
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
