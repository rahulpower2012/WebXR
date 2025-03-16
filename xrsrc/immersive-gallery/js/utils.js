/**
 * Utilities for the WebXR project
 * @module utils
 */

/**
 * Logs an error with a custom message
 * @param {Error} error - The error to log
 * @param {string} message - Custom error message
 */
export function logError(error, message) {
    console.error(`${message}: ${error.message}`, error);
    document.getElementById('consoleDiv').innerHTML = document.getElementById('consoleDiv').innerHTML + `<p>${message}: ${error}</p>`
}
