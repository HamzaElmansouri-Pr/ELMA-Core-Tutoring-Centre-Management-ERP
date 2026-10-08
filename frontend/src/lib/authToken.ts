/**
 * Simple module-level token holder.
 * Avoids circular dependency between axios.ts ↔ authStore.ts
 * and eliminates the race condition where localStorage hasn't
 * been written yet when the interceptor fires.
 */
let _token: string | null = null;

export function setAuthToken(token: string | null) {
    _token = token;
}

export function getAuthToken(): string | null {
    // In-memory token is always authoritative (set synchronously).
    // Fall back to localStorage for page-reload rehydration.
    if (_token) return _token;

    try {
        const raw = localStorage.getItem('elma-auth-storage');
        if (raw) {
            const parsed = JSON.parse(raw);
            const stored = parsed.state?.token;
            if (stored) {
                _token = stored;       // cache it
                return stored;
            }
        }
    } catch { /* ignore */ }

    return null;
}
