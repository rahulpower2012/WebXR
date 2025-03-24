// import * as THREE from 'three';
import { startCameraPreview, stopCameraPreview, setupCameraSelection, handleCameraChange } from './camera.js';
import { startAR, stopAR, init3jsXR, addTextToScene, loadFont } from './xr.js';
import { logError, setUpLogging } from '../utils.js';


// --- Global Variables ---
let isCameraRunning = false;
let videoElement;
let toggleCameraButton;
let consoleDiv;

// --- DOMContentLoaded Event ---
/**
 * Initializes the application, setting up event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    consoleDiv = document.getElementById('consoleDiv');
    setUpLogging(consoleDiv);
    logError('error', 'success8');
    const startARButton = document.getElementById('startARButton');
    const stopARButton = document.getElementById('stopARButton');
    const cameraSelect = document.getElementById('cameraSelect');
    const textInput = document.getElementById('textInput');
    const addTextButton = document.getElementById('addTextButton');
    toggleCameraButton = document.getElementById('toggleCameraButton');
    videoElement = document.getElementById('cameraPreview');

    // Event Listeners    
    startARButton.addEventListener('click', () => {
        //Ensure camera stopped when startiing AR
        logError('rwgrw', 'eefw2');
        if (textInput.value) {
            stopCameraPreview(videoElement, toggleCameraButton, isCameraRunning);
            // Then start XR.
            startAR(startARButton, stopARButton, textInput.value);
        } else {
            logError(JSON.stringify({ message: 'Please enter some text', type: 'FOR_USER' }), 'startButton eventListener');
            return;
        }

    });


    stopARButton.addEventListener('click', () => stopAR(startARButton, stopARButton));

    toggleCameraButton.addEventListener('click', toggleCamera);
    cameraSelect.addEventListener('change', handleCameraChange);

    addTextButton.addEventListener('click', async () => {
        const text = textInput.value;
        logError(text, text);

        if (text) {
            logError('calling addTextToScene', 'calling addTextToScene');
            addTextToScene(text); // Only allow if font is loaded
            console.warn("Font is still be loaded. Try again in few seconds.");
            logError('font still loading', 'font still loading');
        } else {
            alert("Please enter some text!");
        }
    });
    // Initial Setup
    setupCameraSelection(cameraSelect); // Initialize camera selection

    // Initialize XR (but don't start the session yet)
    init3jsXR();
});


// --- Camera Functions (Delegated to camera.js) ---
// --- Toggle start/stop camera ---
/**
 * Starts/stops camera preview
 *  @async
 */
async function toggleCamera() {
    if (isCameraRunning) {
        stopCameraPreview(videoElement, toggleCameraButton);
    } else {
        const cameraSelect = document.getElementById('cameraSelect');
        if (cameraSelect.value) {
            await startCameraPreview(cameraSelect.value, videoElement, toggleCameraButton);
        } else {
            console.error('No cameras available.');
        }
    }
    isCameraRunning = !isCameraRunning;
}
