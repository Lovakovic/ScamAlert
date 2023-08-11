import {getDomainData, markDomainAsNotified} from "../background/storage.js";

async function init() {
    let domain = new URLSearchParams(window.location.search).get('domain');
    let stats = await getDomainData(domain);

    if (stats) {
        document.getElementById('domain-name').textContent = domain;
        document.getElementById('total-engines').textContent = stats.harmless + stats.malicious +
            stats.suspicious + stats.undetected;
        document.getElementById('malicious-engines').textContent = stats.malicious;
    }

    document.getElementById('mute-domain-name').textContent = domain;

    document.getElementById('close-button').addEventListener('click', () => {
        let muteDomain = document.getElementById('muteCheckbox').checked;
        if (muteDomain) {
            markDomainAsNotified(domain, true)
                .catch(error => console.error(error));
        }
        window.close();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => console.error(err));
});
