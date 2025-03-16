/**
 * Main entry point for the WebXR project
 * @module main
 */

import { enumerateCameras, startCamera, stopCamera } from './camera.js';
import { startAR, stopAR } from './ar.js';

document.addEventListener('DOMContentLoaded', () => {
    const cameraSelect = document.getElementById('camera-select');
    const cameraFeed = document.getElementById('camera-feed');
    const startCameraBtn = document.getElementById('start-camera-btn');
    const stopCameraBtn = document.getElementById('stop-camera-btn');
    const startARBtn = document.getElementById('start-ar-btn');
    const stopARBtn = document.getElementById('stop-ar-btn');

    enumerateCameras(cameraSelect);

    startCameraBtn.addEventListener('click', () => startCamera(cameraFeed, cameraSelect));
    stopCameraBtn.addEventListener('click', () => stopCamera(cameraFeed));
    startARBtn.addEventListener('click', () => startAR(cameraFeed));
    stopARBtn.addEventListener('click', stopAR);
});
