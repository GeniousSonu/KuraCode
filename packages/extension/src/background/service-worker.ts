/**
 * Service worker / background.
 * Provides the keyboard shortcut (CAP-1) and right-click context menu
 * (CAP-2) entry points, which forward a capture request to the content script
 * in the active tab. Saving itself happens in the content script / popup.
 *
 * Handles welcome/onboarding on install, and update badge/notification on version changes.
 */
import {
  MSG_CAPTURE_SELECTION,
  type CaptureSelectionMessage,
} from '../shared/messages';

const MENU_ID = 'kuracode-capture-selection';
const STORAGE_KEY_VERSION = 'kuracode.last_seen_version';
const STORAGE_KEY_UPDATE_SEEN = 'kuracode.update_badge_dismissed';

async function sendCaptureToActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const message: CaptureSelectionMessage = { kind: MSG_CAPTURE_SELECTION };
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // No content script on this page (e.g. chrome:// pages). Silently ignore.
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  // 1. Context menu setup
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Save selection to KuraCode',
      contexts: ['selection'],
    });
  } catch {
    // Menu may already exist
  }

  const currentVersion = chrome.runtime.getManifest().version;

  // 2. Onboarding / Update Flow
  if (details.reason === 'install') {
    // On first install, set initial version marker and open welcome page
    await chrome.storage.local.set({
      [STORAGE_KEY_VERSION]: currentVersion,
      [STORAGE_KEY_UPDATE_SEEN]: true,
    });
    // Open welcome/onboarding tab (or fallback to options/popup page)
    const welcomeUrl = chrome.runtime.getURL('popup.html');
    void chrome.tabs.create({ url: welcomeUrl });
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion || 'unknown';
    // If upgraded, show update badge on extension action icon
    if (previousVersion !== currentVersion) {
      await chrome.storage.local.set({
        [STORAGE_KEY_VERSION]: currentVersion,
        [STORAGE_KEY_UPDATE_SEEN]: false,
      });
      // Set non-intrusive badge text "NEW" or "UPD"
      if (chrome.action?.setBadgeText) {
        chrome.action.setBadgeText({ text: 'NEW' });
        chrome.action.setBadgeBackgroundColor({ color: '#E6B55C' }); // Brand gold
      }
      console.info(`[KuraCode] Updated from ${previousVersion} to ${currentVersion}`);
    }
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_ID) void sendCaptureToActiveTab();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-selection') void sendCaptureToActiveTab();
});
