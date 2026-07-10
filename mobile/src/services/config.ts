/**
 * Points at the deployed sandbox API by default so a freshly installed
 * APK works out of the box. Override at build time for local development
 * against a backend running on your machine (e.g. via `adb reverse`).
 */
export const API_BASE_URL = 'https://payflow.luismendezdev.online';

export const REQUEST_TIMEOUT_MS = 15000;
