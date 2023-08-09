import {onAlarmReceived, onExtensionInstalled, onMessageReceived, onTabRemoved, onTabUpdated} from "./events.js";

// Ignoring this for now, it'll have to be replaced with an alarm since the script is non-persistent
// setInterval(cleanupExpiredScans, CLEANUP_INTERVAL);

browser.tabs.onUpdated.addListener(onTabUpdated);
browser.tabs.onRemoved.addListener(onTabRemoved);
browser.runtime.onInstalled.addListener(onExtensionInstalled);
browser.runtime.onMessage.addListener(onMessageReceived);
browser.alarms.onAlarm.addListener(onAlarmReceived);
