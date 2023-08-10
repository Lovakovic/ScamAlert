document.getElementById('save-button').addEventListener('click', () => {
    let apiKey = document.getElementById('api-key').value;
    browser.storage.local.set({apiKey: apiKey}, () => {
        window.location.href = "allSet.html";
    });
});
