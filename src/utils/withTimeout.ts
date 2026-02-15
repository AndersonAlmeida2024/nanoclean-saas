/**
 * Wraps a promise with a timeout to prevent infinite loading states.
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms = 10s)
 * @param errorMessage - Custom error message for timeout
 * @returns The promise result or throws timeout error
 * 
 * @example
 * const data = await withTimeout(
 *   fetchData(),
 *   15000,
 *   'Timeout ao carregar dados'
 * );
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000,
    errorMessage: string = 'Operation timed out'
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}
