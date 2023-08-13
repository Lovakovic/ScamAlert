import {onAlarmReceived, onExtensionInstalled, onMessageReceived, onTabRemoved, onTabUpdated} from "../modules/events.js";

browser.tabs.onUpdated.addListener(onTabUpdated);
browser.tabs.onRemoved.addListener(onTabRemoved);
browser.runtime.onInstalled.addListener(onExtensionInstalled);
browser.runtime.onMessage.addListener(onMessageReceived);
browser.alarms.onAlarm.addListener(onAlarmReceived);
