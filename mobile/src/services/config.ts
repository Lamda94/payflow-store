/**
 * Points at the deployed sandbox API by default so a freshly installed
 * APK works out of the box. Override at build time for local development
 * against a backend running on your machine (e.g. via `adb reverse`).
 */
export const API_BASE_URL = 'https://payflow.luismendezdev.online';

export const REQUEST_TIMEOUT_MS = 15000;

/**
 * POST /transactions/:id/pay polls the PSP synchronously and routinely takes
 * 7–20s against the sandbox. It must be higher than the reverse proxy's own
 * upstream timeout (60s) so the client always outlives the server-side answer
 * — timing out first orphans a transaction the backend goes on to finalize.
 */
export const PAY_REQUEST_TIMEOUT_MS = 65000;
