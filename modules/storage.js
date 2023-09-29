const API_KEY = 'apiKey';
const ALARM_DATA_KEY = 'alarmData';
const PENDING_SCANS_KEY = 'pendingScans';
const RETRY_COUNT_KEY = "retryCounts";
const ANALYSIS_RESULTS_KEY = 'analysisResults';

// Utility function to interact with the storage API based on the browser
const storageGet = (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result);
        });
    });
};

const storageSet = (data) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
};

// Fetches the API key from storage
export const getApiKey = async () => {
    const data = await storageGet(API_KEY);
    return data[API_KEY];
};

// Retrieves scan results for all domains from storage
export const getAllDomainAnalysisData = async () => {
    const data = await storageGet(ANALYSIS_RESULTS_KEY);
    return data[ANALYSIS_RESULTS_KEY] || {};
};

// Replaces the existing domain scan results with new data
export const replaceDomainAnalysisData = async (newData) => {
    await storageSet({ [ANALYSIS_RESULTS_KEY]: newData[ANALYSIS_RESULTS_KEY] });
};

// Function to get domain data
export const getDomainData = async (domain) => {
    const data = await storageGet(ANALYSIS_RESULTS_KEY);
    return data[ANALYSIS_RESULTS_KEY]?.[domain] || null;
};

// Function to save domain data
export const setDomainData = async (domain, results) => {
    const currentData = await storageGet(ANALYSIS_RESULTS_KEY);
    const updatedResults = {
        ...currentData[ANALYSIS_RESULTS_KEY],
        [domain]: results
    };
    await storageSet({ [ANALYSIS_RESULTS_KEY]: updatedResults });
};

// Function to mark a domain with last notified timestamp
export const markDomainAsNotified = async (domain, mute = false) => {
    const currentTime = Date.now();
    const domainData = await getDomainData(domain);
    await setDomainData(domain, { ...domainData, lastNotified: currentTime, muted: mute });
};

// Function to increase a counter (e.g., totalScanned, maliciousScanned)
export const incrementScannedCounter = async (key) => {
    const data = await storageGet(key);
    const count = (data[key] || 0) + 1;
    await storageSet({ [key]: count });
    return count;
};

// Function to check if a domain has been scanned previously
export const hasDomainBeenScanned = async (domain) => {
    const data = await getDomainData(domain);
    return data !== null;
};

// Returns the total count of scanned domains
export const getTotalScannedCount = async () => {
    const data = await storageGet('totalScanned');
    return data.totalScanned || 0;
};

// Returns the total count of malicious domains scanned
export const getMaliciousScannedCount = async () => {
    const data = await storageGet('maliciousScanned');
    return data.maliciousScanned || 0;
};

// Checks if a domain scan is pending
export const isDomainPendingScanResults = async (domain) => {
    const data = await storageGet(PENDING_SCANS_KEY);
    return data.pendingScans?.[domain] !== undefined;
};

// Marks a domain as pending a scan
export const markDomainAsPendingResults = async (domain, analysisId) => {
    const data = await storageGet(PENDING_SCANS_KEY);
    const updatedPendingScans = {
        ...data.pendingScans,
        [domain]: analysisId
    };
    await storageSet({ pendingScans: updatedPendingScans });
};

// Removes a domain from pending scans after results are received
export const removeDomainFromPending = async (domain) => {
    const data = await storageGet(PENDING_SCANS_KEY);
    if (data.pendingScans?.[domain]) {
        delete data.pendingScans[domain];
        await storageSet({ pendingScans: data.pendingScans });
    }
};

// Retreives domain for a given analysis ID
export const getDomainByAnalysisId = async (analysisId) => {
    const data = await storageGet(ALARM_DATA_KEY);
    return data.alarmData?.[analysisId];
};

// Stores alarm data for later retrieval
export const setAnalysisIdToStorage = async (analysisId, domain) => {
    const data = await storageGet(ALARM_DATA_KEY);
    const updatedAlarms = {
        ...data.alarmData,
        [analysisId]: domain
    };
    await storageSet({ [ALARM_DATA_KEY]: updatedAlarms });
};

// Clears analysis ID from storage
export const clearAnalysisIdFromStorage = async (analysisId) => {
    const data = await storageGet(ALARM_DATA_KEY);
    if (data.alarmData?.[analysisId]) {
        delete data.alarmData[analysisId];
        await storageSet({ [ALARM_DATA_KEY]: data.alarmData });
    }
};

// Retrieves the retry count for a given analysis ID
export const getRetryCount = async (analysisId) => {
    const data = await storageGet(RETRY_COUNT_KEY);
    return data.retryCounts?.[analysisId] || 0;
};

// Increments the retry count for a given analysis ID
export const increaseRetryCount = async (analysisId) => {
    const data = await storageGet(RETRY_COUNT_KEY);
    const updatedRetryCounts = {
        ...data.retryCounts,
        [analysisId]: (data.retryCounts?.[analysisId] || 0) + 1
    };
    await storageSet({ [RETRY_COUNT_KEY]: updatedRetryCounts });
};
