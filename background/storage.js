const ALARM_DATA_KEY = 'alarmData';
const PENDING_SCANS_KEY = 'pendingScans';
const RETRY_COUNT_KEY = "retryCounts";
const ANALYSIS_RESULTS_KEY = 'analysisResults';

export const getApiKey = async () => {
    return (await browser.storage.local.get('apiKey')).apiKey;
}

// Function to get domain data
export const getDomainData = async (domain) => {
    const data = await browser.storage.local.get(ANALYSIS_RESULTS_KEY);
    return data?.[ANALYSIS_RESULTS_KEY]?.[domain] || null;
}

// Function to save domain data
export const setDomainData = async (domain, results) => {
    const currentData = await browser.storage.local.get(ANALYSIS_RESULTS_KEY);
    const updatedResults = {
        ...currentData?.[ANALYSIS_RESULTS_KEY],
        [domain]: results
    };
    await browser.storage.local.set({ [ANALYSIS_RESULTS_KEY]: updatedResults });
}

// Function to mark a domain with last notified timestamp
export const markDomainAsNotified = async (domain) => {
    const currentTime = Date.now();
    const domainData = await getDomainData(domain);
    await setDomainData(domain, { ...domainData, lastNotified: currentTime });
}

// Function to increase a counter (e.g., totalScanned, maliciousScanned)
export const incrementScannedCounter = async (key) => {
    const data = await browser.storage.local.get(key);
    const count = (data[key] || 0) + 1;
    await browser.storage.local.set({ [key]: count });
    return count;
}

// Function to check if a domain has been scanned previously
export const hasDomainBeenScanned = async (domain) => {
    const data = await getDomainData(domain);
    return data !== null;
};

// Returns the total count of scanned domains
export const getTotalScannedCount = async () => {
    return (await browser.storage.local.get('totalScanned')).totalScanned || 0;
}

// Returns the total count of malicious domains scanned
export const getMaliciousScannedCount = async () => {
    return (await browser.storage.local.get('maliciousScanned')).maliciousScanned || 0;
}

// Function to check if a domain scan is pending
export const isDomainPendingScanResults = async (domain) => {
    const { pendingScans } = await browser.storage.local.get(PENDING_SCANS_KEY);
    return pendingScans?.[domain] !== undefined;
};

// Function to mark a domain as pending a scan
export const markDomainAsPendingResults = async (domain, analysisId) => {
    const { pendingScans } = await browser.storage.local.get(PENDING_SCANS_KEY);
    const updatedPendingScans = {
        ...pendingScans,
        [domain]: analysisId
    };
    await browser.storage.local.set({ pendingScans: updatedPendingScans });
};

// Function to remove domain from pending scans after results are received
export const removeDomainFromPending = async (domain) => {
    const { pendingScans } = await browser.storage.local.get(PENDING_SCANS_KEY);
    if (pendingScans?.[domain]) {
        delete pendingScans[domain];
        await browser.storage.local.set({ pendingScans });
    }
};

// Function to retrieve domain for a given analysis ID
export const getDomainByAnalysisId = async (analysisId) => {
    const { alarmData } = await browser.storage.local.get(ALARM_DATA_KEY);
    return alarmData?.[analysisId];
};

// Function to store alarm data for later retrieval
export const setAlarmData = async (analysisId, domain) => {
    const { alarmData: currentAlarms } = await browser.storage.local.get(ALARM_DATA_KEY);
    const updatedAlarms = {
        ...currentAlarms,
        [analysisId]: domain
    };
    await browser.storage.local.set({ [ALARM_DATA_KEY]: updatedAlarms });
};

export const cleaAlarmDataFromStorage = async (analysisId) => {
    // Check and remove the alarm data from storage
    const { alarmData: currentAlarms } = await browser.storage.local.get(ALARM_DATA_KEY);
    if (currentAlarms?.[analysisId]) {
        delete currentAlarms[analysisId];
        await browser.storage.local.set({ [ALARM_DATA_KEY]: currentAlarms });
    }
}

export const getRetryCount = async (analysisId) => {
    const { retryCounts } = await browser.storage.local.get(RETRY_COUNT_KEY);
    return retryCounts?.[analysisId] || 0;
};

export const increaseRetryCount = async (analysisId) => {
    const { retryCounts: currentRetryCounts } = await browser.storage.local.get(RETRY_COUNT_KEY);
    const updatedRetryCounts = {
        ...currentRetryCounts,
        [analysisId]: (currentRetryCounts?.[analysisId] || 0) + 1
    };
    await browser.storage.local.set({ [RETRY_COUNT_KEY]: updatedRetryCounts });
};
