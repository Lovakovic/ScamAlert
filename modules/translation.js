export const translatePageContent = () => {
    let elements = document.querySelectorAll('[data-i18n-content]');
    for (let element of elements) {
        let message = chrome.i18n.getMessage(element.getAttribute('data-i18n-content'));
        if (message) {
            element.textContent = message;
        }
    }
}

export const translatePageData = () => {
    let elements = document.querySelectorAll('[data-i18n]');

    for (let element of elements) {
        let messageKey = element.getAttribute('data-i18n');
        let message = chrome.i18n.getMessage(messageKey);

        if (message) {
            // If the element is an input and its type is button, set its value. Otherwise, set its textContent.
            if (element.tagName.toLowerCase() === 'input' && element.type === 'button') {
                element.value = message;
            } else {
                element.innerHTML = message;
            }
        }
    }
}

translatePageContent()
translatePageData()
