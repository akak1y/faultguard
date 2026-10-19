export type MaybeAsync<T> = T | Promise<T>;

export function createAbortError(signal?: AbortSignal): Error {
    if (signal?.reason !== undefined) {
        if (signal.reason instanceof Error) return signal.reason;
        return new Error(String(signal.reason));
    }
    if (typeof DOMException !== 'undefined') {
        return new DOMException('The operation was aborted.', 'AbortError');
    }
    const err = new Error('The operation was aborted.');
    err.name = 'AbortError';
    return err;
}

export function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}
