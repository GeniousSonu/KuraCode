/**
 * Service worker / background.
 * Provides the keyboard shortcut (CAP-1) and right-click context menu
 * (CAP-2) entry points, which forward a capture request to the content script
 * in the active tab. Saving itself happens in the content script / popup.
 */
import {
  MSG_CAPTURE_SELECTION,
  type CaptureSelectionMessage,
} from '../shared/messages';

const MENU_ID = 'kuracode-capture-selection';

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Save selection to KuraCode',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_ID) void sendCaptureToActiveTab();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-selection') void sendCaptureToActiveTab();
});
