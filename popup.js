async function main() {
    let apiKey = (await browser.storage.local.get('apiKey')).apiKey;

    let setupContent = document.getElementById('setup-content');
    let mainContent = document.getElementById('main-content');
    let statusElement = document.getElementById('status');
    let infoElement = document.getElementById('info');
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
        statusElement.textContent = 'Error: No active tab';
        return;
    }

    let url = new URL(tab.url);
    let domain = url.hostname;
    let result = await browser.storage.local.get(domain);

    if (Object.keys(result).length === 0) {
        // Domain is not in local storage
        mainContent.style.background = 'blue';
        statusElement.textContent = 'Loading...';
    } else {
        // Domain is in local storage
        let stats = result[domain];
        if (stats.malicious >= 2) {
            // Site is malicious
            mainContent.style.background = 'red';
            statusElement.textContent = 'Warning!';
            infoElement.textContent = `${stats.malicious} engines flagged this site as malicious.`;
        } else {
            // Site is safe
            mainContent.style.background = 'green';
            statusElement.textContent = 'Safe';
            infoElement.textContent = 'This site is safe to visit.';
        }

        // Display stats
        let total = await browser.storage.local.get('totalScanned');
        let malicious = await browser.storage.local.get('maliciousScanned');

        document.getElementById('total').textContent = total.totalScanned || 0;
        document.getElementById('malicious').textContent = malicious.maliciousScanned || 0;
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'refreshPopup') {
        main();
    }
});

main();
