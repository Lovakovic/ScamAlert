# ScamAlert Firefox Extension

ScamAlert is a Firefox browser extension designed to enhance the security of your browsing experience by monitoring and analyzing visited URLs for potential threats. It is now live on the Firefox Add-on store!

## Overview

Built upon Manifest V3, this extension works silently in the background, ensuring the user doesn't visit malicious sites. Its primary functionality involves:
- Extracting the domain part of every visited URL.
- Checking its local storage for a previous scan of the domain.
- If not previously scanned, the domain is sent to the VirusTotal API for a thorough analysis.
- Interpreting the results and storing them, alongside relevant metadata, locally.

If a site is flagged as malicious (with over two engines marking it as such), the user is alerted, preventing visits to potentially dangerous domains.

## Features

### Efficient Alerting System
The extension uses a `lastNotified` timestamp to avoid redundant alerts and allows opting out of alerts for specific domains.

### Periodic Refresh of Scan Data
Scan results have a defined validity period, after which they are purged and re-scanned upon revisit.

### Extension Dashboard
Provides a status report, API quota usage, statistics about scanned domains, and a count of malicious domains detected.

### Initial Setup Process
Includes a plain-language explanation, list of required permissions, guidance on registering for a VirusTotal API key, and a setup completion confirmation.

## Store Link
Find the extension on the Firefox Add-on store: [ScamAlert Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/scamalert/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)

## Motivation

This extension is part of my completed thesis on the dangers posed by compromised domains. It aims to protect users from deceitful domains seeking to steal information and money.

## Future Plans

Further development will focus on adding a settings page for customizable constants currently in `const.js`.

## Contribute

Contributions are welcome! If you're interested in enhancing online security and have ideas or improvements, please don't hesitate to contribute to this project.

---

**Note**: Exercise caution with permissions. ScamAlert is about collective online safety responsibility!

## Screenshots

### Safe Website
![Safe Website](https://addons.mozilla.org/user-media/previews/thumbs/287/287009.jpg?modified=1693495990)

### Malicious Website
![Malicious Website](https://addons.mozilla.org/user-media/previews/thumbs/287/287011.jpg?modified=1693495990)

### Loading Status
![Loading Status](https://addons.mozilla.org/user-media/previews/thumbs/287/287012.jpg?modified=1693495990)

### Not Scanned Status
![Not Scanned Status](https://addons.mozilla.org/user-media/previews/thumbs/287/287008.jpg?modified=1693495990)

### Dangerous Site Page
![Dangerous Site Page](https://addons.mozilla.org/user-media/previews/thumbs/287/287010.jpg?modified=1693495990)


