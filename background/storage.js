const ALARM_DATA_KEY = 'alarmData';
const PENDING_SCANS_KEY = 'pendingScans';

// Function to get domain data
export const getDomainData = async (domain) => {
    const data = await browser.storage.local.get(`domains.${domain}`);
    return data?.[`domains.${domain}`] || null;
}

// Function to save domain data
export const setDomainData = async (domain, results) => {
    await browser.storage.local.set({ [`domains.${domain}`]: results });
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

// Function to check if a domain scan is pending
export const isDomainPendingScan = async (domain) => {
    const { pendingScans } = await browser.storage.local.get(PENDING_SCANS_KEY);
    return pendingScans?.[domain] !== undefined;
};

// Function to mark a domain as pending a scan
export const markDomainAsPending = async (domain, analysisId) => {
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
    if (pendingScans && pendingScans[domain]) {
        delete pendingScans[domain];
        await browser.storage.local.set({ pendingScans });
    }
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

// Function to retrieve domain for a given analysis ID
export const getDomainByAnalysisId = async (analysisId) => {
    const { alarmData } = await browser.storage.local.get(ALARM_DATA_KEY);
    return alarmData?.[analysisId];
};

// Function to clear alarm data after it's been used
export const clearAlarmData = async (analysisId) => {
    const { alarmData: currentAlarms } = await browser.storage.local.get(ALARM_DATA_KEY);
    if (currentAlarms && currentAlarms[analysisId]) {
        delete currentAlarms[analysisId];
        await browser.storage.local.set({ [ALARM_DATA_KEY]: currentAlarms });
    }
};
