import { onTabUpdated, onTabRemoved, onExtensionInstalled, onMessageReceived } from './events.js';

browser.tabs.onUpdated.addListener(onTabUpdated);
browser.tabs.onRemoved.addListener(onTabRemoved);
browser.runtime.onInstalled.addListener(onExtensionInstalled);
browser.runtime.onMessage.addListener(onMessageReceived);
