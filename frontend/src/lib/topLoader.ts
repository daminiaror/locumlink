type Listener = (active: boolean) => void;
const listeners: Listener[] = [];
let depth = 0;
function emit() {
    const active = depth > 0;
    listeners.forEach((fn) => fn(active));
}
export function startLoader(): void {
    if (typeof window === 'undefined')
        return;
    depth += 1;
    if (depth === 1)
        emit();
}
export function stopLoader(): void {
    if (typeof window === 'undefined')
        return;
    depth = Math.max(0, depth - 1);
    if (depth === 0)
        emit();
}
export function subscribeTopLoader(listener: Listener): () => void {
    if (typeof window === 'undefined')
        return () => { };
    listeners.push(listener);
    listener(depth > 0);
    return () => {
        const i = listeners.indexOf(listener);
        if (i > -1)
            listeners.splice(i, 1);
    };
}
export function beforeClientNavigation(href: string): void {
    if (typeof window === 'undefined')
        return;
    try {
        const next = new URL(href, window.location.origin);
        const cur = new URL(window.location.href);
        if (next.pathname === cur.pathname && next.search === cur.search)
            return;
    }
    catch {
    }
    startLoader();
}
