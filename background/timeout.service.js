const tabTimeouts = {};
const domainTabsCount = {};
const domainsPendingImmediatePost = {};

export const setTabTimeout = async (tabId, domain, timeoutCallback, delay) => {
    domainTabsCount[domain] = (domainTabsCount[domain] || 0) + 1;

    if (domainTabsCount[domain] >= 1) {
        domainsPendingImmediatePost[domain] = true;

        const timeoutId = setTimeout(() => {
            timeoutCallback();
            delete domainsPendingImmediatePost[domain];
        }, delay);

        tabTimeouts[tabId] = {
            domain: domain,
            timeoutId: timeoutId
        };
    }
}

export const clearTabTimeout = (tabId, currentDomain) => {
    const previousDomain = tabTimeouts[tabId]?.domain;

    if (previousDomain && previousDomain !== currentDomain) {
        domainTabsCount[previousDomain]--;
        if (domainTabsCount[previousDomain] <= 0) {
            delete domainTabsCount[previousDomain];
            if (tabTimeouts[tabId]?.timeoutId) {
                clearTimeout(tabTimeouts[tabId].timeoutId);
                delete tabTimeouts[tabId];
            }
        }
    }
}

export const isDomainPendingImmediatePost = (domain) => {
    return domainsPendingImmediatePost[domain];
}

export const markDomainAsPendingImmediatePost = (domain) => {
    domainsPendingImmediatePost[domain] = (domainsPendingImmediatePost[domain] || 0) + 1;
}
