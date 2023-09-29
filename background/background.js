import {onAlarmReceived, onExtensionInstalled, onMessageReceived, onTabRemoved, onTabUpdated} from "../modules/events.js";

chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.tabs.onRemoved.addListener(onTabRemoved);
chrome.runtime.onInstalled.addListener(onExtensionInstalled);
chrome.runtime.onMessage.addListener(onMessageReceived);
chrome.alarms.onAlarm.addListener(onAlarmReceived);
