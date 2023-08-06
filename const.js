// Timeouts for saving API calls
export const POST_URL_TIMEOUT_MS = 10 * 1000;
export const REPORT_FETCH_DELAY_MS = 20 * 1000;

// Removal of stale scan results
export const SCAN_EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000;  // 30 days in milliseconds
export const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // Once a day


export const VT_API_URLS = {
    POST_URL: 'https://www.virustotal.com/api/v3/urls',
    GET_ANALYSIS: 'https://www.virustotal.com/api/v3/analyses/'
};
