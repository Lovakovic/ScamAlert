import {VT_API_URLS} from "../const.js";
import {getApiKey} from "./storage.js";

let apiKey = '';

class APIKeyMissingError extends Error {}

const ensureApiKey = async () => {
    let result = await getApiKey();
    apiKey = result || '';
    if (!apiKey) {
        throw new APIKeyMissingError("API key is not available.");
    }
}

export const postUrl = async (url) => {
    try {
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
    } catch (e) {
        if(e instanceof APIKeyMissingError) {
            console.error('URL couldn\'t be scanned because API key is not available.')
            return null;
        }
        throw e;
    }
}

export const getAnalysisResults = async (analysisId) => {
    try {
        await ensureApiKey();
        const url = VT_API_URLS.GET_ANALYSIS + analysisId;
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
            console.log('Analysis results aren\'t ready.')
            return null;
        }
    } catch (e) {
        if(e instanceof APIKeyMissingError) {
            console.error('URL analysis couldn\'t be retrieved because API key is not available.')
            return null;
        }
        throw e;
    }
}

/**
 * Fetches the quota summary for the user and returns the relevant details.
 * @returns {Object} Quota details of interest.
 */
export async function getQuotaSummary() {
    try {
        await ensureApiKey();

        const url = `${VT_API_URLS.GET_QUOTAS}${apiKey}/overall_quotas`;

        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'x-apikey': apiKey
            },
        });

        if (response.status !== 200) {
            console.error(`API returned status: ${response.status}`);
            return null;
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
        if(error instanceof APIKeyMissingError) {
            console.error('API quota couldn\'t be retrieved because API key is not available.')
            return null;
        }
        throw error;
    }
}

export const isValidApiKey =  async (inputApiKey) => {
    try {
        const url = `${VT_API_URLS.GET_QUOTAS}${inputApiKey}/overall_quotas`;

        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'x-apikey': inputApiKey
            }
        });

        return response.status === 200;
    } catch (error) {
        console.error(`Error while validating API key: ${error.message}`);
        return false;
    }
}
