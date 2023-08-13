# ScamAlert Firefox Extension

ScamAlert is a Firefox browser extension designed to enhance the security of your browsing experience by monitoring and analyzing visited URLs for potential threats.

## Overview

Built upon Manifest V3, this extension works silently in the background, ensuring the user doesn't visit malicious sites. Its primary functionality involves:
- Extracting the domain part of every visited URL.
- Checking its local storage for a previous scan of the domain.
- If not previously scanned, the domain is sent to the VirusTotal API for a thorough analysis.
- Interpreting the results and storing them, alongside relevant metadata, locally.

Should a site be flagged as malicious (with over two engines marking it as such), the user is alerted. This helps in preventing visits to "domains of compromised character" that might lure users into divulging personal information or credentials.

## Features

### Efficient Alerting System
To avoid redundant alerts, the extension uses a `lastNotified` timestamp meaning tha the user won't be spammed with alerts if he chooses to browse the malicious site. Users also have the flexibility to opt-out of alerts for specific domains, either from the alert page or from the extension's popup.

### Periodic Refresh of Scan Data
Each scan's result has a defined validity period. After this period, the scan is purged from the local storage. If the user revisits the domain, a new scan is initiated.

### Extension Dashboard
Accessed via the extension icon, this 'home' page provides users with:
- A status report on the currently opened page.
- A daily and hourly usage of user's API quota
- Statistics about scanned domains.
- A count of malicious domains detected.

### Initial Setup Process
To ensure ease of use and transparency, the setup process includes:
- A plain-language explanation of the extension's workings.
- A detailed list of required permissions, with a guarantee that no URLs or personal data are shared except with the VirusTotal API.
- Guidance on registering with VirusTotal for a free API key. *(Note: This extension is not affiliated with VirusTotal)*.
- A form to save and validate the API key.
- A confirmation page signaling the completion of the setup.

## Motivation

This extension is part of my thesis on the potential dangers posed by compromised domains that attempt to deceive users, aiming to steal information and consequently, money. While it's currently not available on the Firefox store due to ongoing work on the thesis, plans are in place for its eventual release there.

## Future Plans

Once my thesis is complete, I aim to publish this extension on the Firefox store, widening its reach and thereby enhancing online security for many users. I will also add a settings page on which the users will be able to customize most of the constants which are now hard-coded into `const.js`.

---

**Note**: Always ensure you provide permissions carefully and responsibly. ScamAlert is a collective responsibility!

