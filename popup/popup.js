import {getApiKey, getDomainData, getMaliciousScannedCount, getTotalScannedCount} from "../background/storage.js";
import {MALICIOUS_THRESHOLD} from "../const.js";

const greenColor = '#3e9444';
const blueColor = '#3e6294';
const redColor = '#9c1c1c';

function setStatus(message, info, color) {
    let mainContent = document.getElementById('main-content');
    let statusElement = document.getElementById('status');
    let infoElement = document.getElementById('info');

    mainContent.style.background = color;
    statusElement.classList.add('white-text');
    infoElement.classList.add('white-text');
    statusElement.textContent = message;
    infoElement.textContent = info;
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

export const refreshPopup = async () => {
    let apiKey = await getApiKey();

    let mainContent = document.getElementById('main-content');
    let setupContent = document.getElementById('setup-content');
    let statsContent = document.getElementById('stats-content');

    // Display stats regardless of the API key or domain status
    let total = await getTotalScannedCount();
    let malicious = await getMaliciousScannedCount();
    let safe = total - malicious;

    document.getElementById('totalSites').textContent = "Total Sites Scanned: " + total;

    setLegendColors();
    drawChart(safe, malicious);

    // If no API key, show setup screen
    if (!apiKey) {
        setupContent.classList.remove("d-none");
        mainContent.classList.add("d-none");
        statsContent.classList.add("d-none");
        document.getElementById('setup-button').addEventListener('click', function() {
            browser.tabs.create({ url: "../setup/welcome.html" });
        });
        return;
    }

    let tab = (await browser.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab?.url) {
        setStatus('Site not scanned', 'Error: No active tab');
        return;
    }

    let url = new URL(tab.url);
    let domain = url.hostname;

    if (!url.protocol.startsWith('http')) {
        setStatus('Site not scanned', 'This site won\'t be scanned as only domains using HTTP or HTTPS protocols are scanned.', blueColor);
        return;
    }

    let domainData = await getDomainData(domain);

    if (!domainData) {
        setStatus('Loading...', '', blueColor);
        return;
    }

    if (domainData.malicious >= MALICIOUS_THRESHOLD) {
        setStatus('Warning!', `${domainData.malicious} engines flagged this site as malicious.`, redColor);
    } else {
        setStatus('Safe', 'This site is safe to visit.', greenColor);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    refreshPopup()
        .catch(error => console.error(error));
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.command === "refreshPopup") {
        await refreshPopup();
    }
});
