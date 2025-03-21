// import * as THREE from 'three';
import { startCameraPreview, stopCameraPreview, setupCameraSelection, handleCameraChange } from './camera.js';
import { startAR, stopAR, init3jsXR } from './xr.js';
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
    logError('error', 'success7');
    const startARButton = document.getElementById('startARButton');
    const stopARButton = document.getElementById('stopARButton');
    const cameraSelect = document.getElementById('cameraSelect');
    toggleCameraButton = document.getElementById('toggleCameraButton');
	videoElement = document.getElementById('cameraPreview');

    // Event Listeners
    startARButton.addEventListener('click', () => {
        //Ensure camera stopped when startiing AR
        logError('rwgrw', 'eefw2');
        stopCameraPreview(videoElement, toggleCameraButton, isCameraRunning);
        
        init3jsXR();
		// Then start XR.
        startAR(startARButton, stopARButton);

    });
	stopARButton.addEventListener('click', () => stopAR(startARButton, stopARButton));

    toggleCameraButton.addEventListener('click', toggleCamera);
    cameraSelect.addEventListener('change', handleCameraChange);

    // Initial Setup
    setupCameraSelection(cameraSelect); // Initialize camera selection

	// Initialize XR (but don't start the session yet)
});


// --- Camera Functions (Delegated to camera.js) ---
// --- Toggle start/stop camera ---
/**
 * Starts/stops camera preview
 *  @async
 */
async function toggleCamera() {
    if (isCameraRunning) {
        stopCameraPreview(videoElement, toggleCameraButton );
    } else {
	    const cameraSelect = document.getElementById('cameraSelect');
	    if(cameraSelect.value){
           await startCameraPreview(cameraSelect.value, videoElement, toggleCameraButton);
		} else {
			console.error('No cameras available.');
		}
    }
	isCameraRunning =  !isCameraRunning;
}
