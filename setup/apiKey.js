import { isValidApiKey } from "../modules/api.js";

document.getElementById('save-button').addEventListener('click', () => {
    let apiKey = document.getElementById('api-key').value;

    isValidApiKey(apiKey).then(isValid => {
        if (isValid) {
            chrome.storage.local.set({ apiKey: apiKey }, () => {
                window.location.href = "allSet.html";
            });
        } else {
            document.getElementById('warning-message').classList.remove('d-none');
        }
    }).catch(error => {
        console.error(`Error while validating API key: ${error.message}`);
        document.getElementById('warning-message').classList.remove('d-none');
    });
});
