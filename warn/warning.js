import {getDomainData, markDomainAsNotified} from "../modules/storage.js";

async function init() {
    let domain = new URLSearchParams(window.location.search).get('domain');
    let stats = await getDomainData(domain);

    document.title = browser.i18n.getMessage('dangerous_site_detected');
    document.querySelector('.lead').textContent = browser.i18n.getMessage('lead_warning', [domain]);

    if (stats) {
        const totalEngines = stats.harmless + stats.malicious + stats.suspicious + stats.undetected;
        document.getElementById('info').textContent = browser.i18n.getMessage('info_about_malicious', [totalEngines, stats.malicious]);
    }

    document.querySelector('label[for="muteCheckbox"]').textContent = browser.i18n.getMessage('mute_domain', [domain]);

    // Translate elements without placeholders
    const elements = document.querySelectorAll('[data-i18n]');
    for (const element of elements) {
        const messageKey = element.getAttribute('data-i18n');
        element.textContent = browser.i18n.getMessage(messageKey);
    }

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
