// Timeouts for saving API calls
export const POST_URL_TIMEOUT_MS = 10 * 1000;
export const REPORT_FETCH_DELAY_MS = 20 * 1000;
export const REPORT_FETCH_MAX_RETRIES = 3;

// Removal of stale scan results
export const SCAN_EXPIRY_DURATION_MIN = 30 * 24 * 60;  // 30 days
export const CLEANUP_INTERVAL_MIN = 24 * 60; // Once a day

export const NOTIFICATION_EXPIRY_MS = 15 * 60 *  1000; // 15 minutes

export const MALICIOUS_THRESHOLD = 2;

export const VT_API_URLS = {
    POST_URL: 'https://www.virustotal.com/api/v3/urls',
    GET_ANALYSIS: 'https://www.virustotal.com/api/v3/analyses/',
    GET_QUOTAS: 'https://www.virustotal.com/api/v3/users/'
};
