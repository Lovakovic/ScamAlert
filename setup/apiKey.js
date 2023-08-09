document.getElementById('save-button').addEventListener('click', () => {
    let apiKey = document.getElementById('api-key').value;
    chrome.storage.local.set({apiKey: apiKey}, () => {
        window.location.href = "allSet.html";
    });
});
