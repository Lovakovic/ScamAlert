document.getElementById('close-button').addEventListener('click', function() {
    chrome.runtime.sendMessage({ command: 'closeSetupTab' });
});
