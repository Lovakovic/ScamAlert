document.getElementById('understandButton').addEventListener('click', function() {
    // Clear the badge text
    browser.browserAction.setBadgeText({text: ''});

    // Close the popup
    window.close();
});
