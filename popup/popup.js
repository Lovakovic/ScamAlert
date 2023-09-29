import {getApiKey, getDomainData, getMaliciousScannedCount, getTotalScannedCount} from "../modules/storage.js";
import {MALICIOUS_THRESHOLD} from "../const.js";
import {getQuotaSummary} from "../modules/api.js";
import {isDomainMuted, shouldSkipUrlScan, updateMuteStatusForDomain} from "../modules/utils.js";
import {translatePageContent} from "../modules/translation.js";

const greenColor = '#3e9444';
const blueColor = '#3e6294';
const redColor = '#9c1c1c';

const muteWrapper = document.getElementById("mute-wrapper");
const muteCheckbox = document.getElementById("mute-checkbox");

function setStatus(messageKey, infoKey, color, ...placeholders) {
    let mainContent = document.getElementById('main-content');
    let statusElement = document.getElementById('status');
    let infoElement = document.getElementById('info');
    mainContent.style.background = color;

    statusElement.textContent = browser.i18n.getMessage(messageKey);
    infoElement.textContent = browser.i18n.getMessage(infoKey, ...placeholders);
    translatePageContent()
}

function setLegendColors() {
    let safeBox = document.querySelector('.legend-item.safe .color-box');
    let maliciousBox = document.querySelector('.legend-item.malicious .color-box');

    safeBox.style.background = greenColor;
    maliciousBox.style.background = redColor;
}

function drawChart(safe, malicious) {
    let total = safe + malicious;
    let safePercent = (safe / total) * 100;

    let chartElement = document.querySelector('.chart-bar');
    chartElement.style.background = `linear-gradient(to right, ${greenColor} 0%, ${greenColor} ${safePercent}%, ${redColor} ${safePercent}%, ${redColor} 100%)`;
    chartElement.style.width = '100%';
}

function toggleQuotaBarsVisibility(show) {
    const quotaBars = document.getElementById('quota-bars');
    if (show) {
        quotaBars.classList.remove('d-none');
    } else {
        quotaBars.classList.add('d-none');
    }
}

export const refreshPopup = async () => {
    let apiKey = await getApiKey();

    let mainContent = document.getElementById('main-content');
    let setupContent = document.getElementById('setup-content');
    let statsContent = document.getElementById('stats-content');

    // Display stats regardless of the API key or domain status
    let total = await getTotalScannedCount();
    let malicious = await getMaliciousScannedCount();
    let safe = total - malicious;

    document.getElementById('totalSites').textContent = browser.i18n.getMessage('total_sites_scanned', total);

    setLegendColors();
    drawChart(safe, malicious);
    if (apiKey) {
        getQuotaSummary()
            .then(data => {
                updateQuotaBars(data);
            });
    }

    // If no API key, show setup screen
    if (!apiKey) {
        setupContent.classList.remove("d-none");
        mainContent.classList.add("d-none");
        statsContent.classList.add("d-none");
        toggleQuotaBarsVisibility(false);
        translatePageContent()
        document.getElementById('setup-button').addEventListener('click', function() {
            browser.tabs.create({ url: "../setup/welcome.html" });
        });
        return;
    }

    let tab = (await browser.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab?.url) {
        setStatus('status_site_not_scanned', 'info_no_active_tab', blueColor);
        return;
    }

    let url = new URL(tab.url);
    let domain = url.hostname;

    if (shouldSkipUrlScan(url)) {
        setStatus('status_site_not_scanned', 'info_non_http', blueColor);
        return;
    }

    let domainData = await getDomainData(domain);

    if (!domainData) {
        setStatus('status_loading', 'blank', blueColor);
        return;
    }

    if (domainData.malicious >= MALICIOUS_THRESHOLD) {
        setStatus('status_warning', `info_warning`, redColor, domainData.malicious);
        muteCheckbox.checked = !!(await isDomainMuted(domain));
        muteWrapper.classList.remove('d-none');
    } else {
        muteWrapper.classList.add('d-none');
        setStatus('safe', 'info_safe', greenColor);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    refreshPopup()
        .catch(error => console.error(error));
});

browser.runtime.onMessage.addListener(async (message) => {
    if (message.command === "refreshPopup") {
        await refreshPopup();
    }
});

function updateQuotaBars(data) {
    let dailyUsed = data.api_requests_daily.used;
    let dailyAllowed = data.api_requests_daily.allowed;
    let dailyPercent = (dailyUsed / dailyAllowed) * 100;

    let hourlyUsed = data.api_requests_hourly.used;
    let hourlyAllowed = data.api_requests_hourly.allowed;
    let hourlyPercent = (hourlyUsed / hourlyAllowed) * 100;

    setProgressValue('dailyQuota', dailyPercent);
    setProgressValue('hourlyQuota', hourlyPercent);
}

function setProgressValue(elementId, value) {
    let progressBar = document.getElementById(elementId).querySelector('.fill-bar');
    progressBar.style.backgroundColor = getComputedStyle(document.getElementById('main-content')).backgroundColor;
    progressBar.style.width = value + "%";
}

muteCheckbox.addEventListener("change", () => {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            const tab = tabs[0];
            if (!tab) {
                console.log("No active tab found");
                return;
            }
            const url = new URL(tab.url);
            const domain = url.hostname;
            updateMuteStatusForDomain(domain, muteCheckbox.checked).catch(error => console.log(error));
            refreshPopup().catch(error => console.log(error));
        })
        .catch(error => {
            console.log(error);
        });
});
