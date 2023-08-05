function setElementText(id, text) {
    document.getElementById(id).textContent = text;
}

function setStatus(message, info, color, textColor) {
    let mainContent = document.getElementById('main-content');
    let statusElement = document.getElementById('status');
    let infoElement = document.getElementById('info');

    mainContent.style.background = color;
    if (textColor === 'white') {
        statusElement.classList.add('white-text');
        infoElement.classList.add('white-text');
    } else {
        statusElement.classList.remove('white-text');
        infoElement.classList.remove('white-text');
    }
    statusElement.textContent = message;
    infoElement.textContent = info;
}

async function main() {
    let apiKey = (await browser.storage.local.get('apiKey')).apiKey;

    let setupContent = document.getElementById('setup-content');
    let statsContent = document.getElementById('stats-content');

    // If no API key, show setup screen
    if (!apiKey) {
        setupContent.classList.remove("d-none");
        mainContent.classList.add("d-none");
        statsContent.classList.add("d-none");
        document.getElementById('setup-button').addEventListener('click', function() {
            browser.tabs.create({ url: "welcome.html" });
        });
        return;
    }

    let tab = (await browser.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab) {
        setElementText('status', 'Error: No active tab');
        return;
    }

    let url = new URL(tab.url);
    let domain = url.hostname;

    if (!url.protocol.startsWith('http')) {
        setStatus('Site not scanned', 'This site won\'t be scanned as only domains using HTTP or HTTPS protocols will be scanned.', 'blue', 'white');
        return;
    }

    let result = await browser.storage.local.get(domain);

    if (Object.keys(result).length === 0) {
        setStatus('Loading...', '', 'blue', 'white');
    } else {
        let stats = result[domain];

        if (stats.nonHTTP) {
            setStatus('Site not scanned', 'This site won\'t be scanned as only domains using HTTP or HTTPS protocols will be scanned.', 'blue', 'white');
        } else if (stats.malicious >= 2) {
            setStatus('Warning!', `${stats.malicious} engines flagged this site as malicious.`, 'red', 'black');
        } else {
            setStatus('Safe', 'This site is safe to visit.', 'green', 'black');
        }

        // Display stats
        let total = await browser.storage.local.get('totalScanned');
        let malicious = await browser.storage.local.get('maliciousScanned');

        setElementText('total', total.totalScanned || 0);
        setElementText('malicious', malicious.maliciousScanned || 0);
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'refreshPopup') {
        main();
    }
});

main();
