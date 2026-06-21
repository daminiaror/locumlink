export const MESSAGES_UPDATED_EVENT = 'll-messages-updated';

export function dispatchMessagesUpdated(): void {
    if (typeof window === 'undefined')
        return;
    window.dispatchEvent(new CustomEvent(MESSAGES_UPDATED_EVENT));
}

export function subscribeMessagesUpdated(handler: () => void): () => void {
    if (typeof window === 'undefined')
        return () => { };
    window.addEventListener(MESSAGES_UPDATED_EVENT, handler);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, handler);
}
