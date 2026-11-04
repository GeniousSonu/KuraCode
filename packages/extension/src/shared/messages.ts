/**
 * Message protocol between the extension surfaces (content script, service
 * worker, popup, side panel). Keep message kinds here so both sides agree.
 */

export const MSG_CAPTURE_SELECTION = 'kuracode:capture-selection';

export interface CaptureSelectionMessage {
  kind: typeof MSG_CAPTURE_SELECTION;
}
