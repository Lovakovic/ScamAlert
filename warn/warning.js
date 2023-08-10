import { getDomainData } from "../background/storage.js";

async function init() {
    let domain = new URLSearchParams(window.location.search).get('domain');
    let stats = await getDomainData(domain);  // Use the getDomainData function from storage logic

    if (stats) {
        document.getElementById('domain-name').textContent = domain;
        document.getElementById('total-engines').textContent = stats.harmless + stats.malicious +
            stats.suspicious + stats.undetected;
        document.getElementById('malicious-engines').textContent = stats.malicious;
    }

    document.getElementById('close-button').addEventListener('click', () => window.close());
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => console.error(err));
});
