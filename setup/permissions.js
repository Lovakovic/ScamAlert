import { VT_API_URLS } from '../const.js';

document.addEventListener("DOMContentLoaded", function() {
    const nextButton = document.getElementById("nextButton");
    const warningSection = document.getElementById("warning-section");

    nextButton.addEventListener("click", function(event) {
        event.preventDefault();

        // Fetch data from VirusTotal API
        fetch(VT_API_URLS.GET_QUOTAS)
            .then(response => {
                // Regardless of the response status code, we proceed to the next page
                window.location.href = "whyApi.html";
            })
            .catch(error => {
                // Here we specifically look for network errors indicating the request didn't go through
                if (error.message === "Failed to fetch" ||
                    error.message === "NetworkError when attempting to fetch resource.") {
                    // Display the warning section
                    warningSection.classList.remove("d-none");
                } else {
                    console.log("Something else went wrong: ", error.message);
                }
            });
    });
});
