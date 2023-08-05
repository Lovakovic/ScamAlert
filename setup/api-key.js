document.getElementById('save-button').addEventListener('click', function() {
    let apiKey = document.getElementById('api-key').value;
    chrome.storage.local.set({apiKey: apiKey}, function() {
        window.location.href = "all-set.html";
    });
});
