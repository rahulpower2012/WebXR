// import * as THREE from 'three';
import { startCameraPreview, stopCameraPreview, setupCameraSelection, handleCameraChange } from './camera.js';
import { startAR, stopAR, initXR } from './xr.js';


// --- Global Variables ---
let isCameraRunning = false;
let videoElement;
let toggleCameraButton;

// --- DOMContentLoaded Event ---
/**
 * Initializes the application, setting up event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const startARButton = document.getElementById('startARButton');
    const stopARButton = document.getElementById('stopARButton');
    const cameraSelect = document.getElementById('cameraSelect');
    toggleCameraButton = document.getElementById('toggleCameraButton');
	videoElement = document.getElementById('cameraPreview');

    // Event Listeners
    startARButton.addEventListener('click', () => {
        //Ensure camera stopped when startiing AR
        stopCameraPreview(videoElement, toggleCameraButton, isCameraRunning);
		// Then start XR.
        startAR(startARButton, stopARButton);

    });
	stopARButton.addEventListener('click', () => stopAR(startARButton, stopARButton));

    toggleCameraButton.addEventListener('click', toggleCamera);
    cameraSelect.addEventListener('change', handleCameraChange);

    // Initial Setup
    setupCameraSelection(cameraSelect); // Initialize camera selection

	// Initialize XR (but don't start the session yet)
    initXR();
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
