import {onTabUpdated, onTabRemoved, onExtensionInstalled, onMessageReceived, onAlarmReceived} from './events.js';
import {cleanupExpiredScans} from "./utils.js";
import {CLEANUP_INTERVAL} from "../const.js";

setInterval(cleanupExpiredScans, CLEANUP_INTERVAL);

browser.tabs.onUpdated.addListener(onTabUpdated);
browser.tabs.onRemoved.addListener(onTabRemoved);
browser.runtime.onInstalled.addListener(onExtensionInstalled);
browser.runtime.onMessage.addListener(onMessageReceived);
browser.alarms.onAlarm.addListener(onAlarmReceived);
