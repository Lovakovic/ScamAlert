async function init() {
    let domain = new URLSearchParams(window.location.search).get('domain');
    let stats = await browser.storage.local.get(domain);

    document.getElementById('domain-name').textContent = domain;
    document.getElementById('total-engines').textContent = stats[domain].harmless + stats[domain].malicious +
        stats[domain].suspicious + stats[domain].undetected;
    document.getElementById('malicious-engines').textContent = stats[domain].malicious;

    document.getElementById('close-button').addEventListener('click', () => window.close());
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => console.error(err));
});
