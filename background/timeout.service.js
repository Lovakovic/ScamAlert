// Contains timeouts by tabId, used for cancellation
const tabTimeouts = {};

// Contains the count of tabs that are opened on each domain
const domainTabsCount = {};

// Contains domains which are waiting to be posted for analysis
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

export const manageScanTimeoutsForDomain = (tabId, currentDomain) => {
    const previousDomain = tabTimeouts[tabId]?.domain;

    if (previousDomain && previousDomain !== currentDomain) {
        domainTabsCount[previousDomain]--;
        if (domainTabsCount[previousDomain] <= 0) {
            delete domainTabsCount[previousDomain];
            if (tabTimeouts[tabId]?.timeoutId) {
                clearTimeout(tabTimeouts[tabId].timeoutId);
                delete domainsPendingImmediatePost[previousDomain];
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

export const removeDomainFromPendingImmediatePOst = (domain) => {
    domainsPendingImmediatePost[domain] = undefined;
}
