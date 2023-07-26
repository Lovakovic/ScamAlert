document.getElementById('close-button').addEventListener('click', function() {
    browser.runtime.sendMessage({command: "closeSetupTab"});
});
