export const translatePageContent = () => {
    let elements = document.querySelectorAll('[data-i18n-content]');
    for (let element of elements) {
        let message = browser.i18n.getMessage(element.getAttribute('data-i18n-content'));
        if (message) {
            element.textContent = message;
        }
    }
}
