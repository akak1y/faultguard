export class TimeoutError extends Error {
    constructor(
        readonly ms: number,
        message?: string,
    ) {
        super(message ?? `Operation timed out after ${ms}ms`);
        this.name = 'TimeoutError';
    }
}
