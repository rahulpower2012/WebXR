/**
 * Camera handling for the WebXR project
 * @module camera
 */

// import { logError } from './utils.js';

let cameraStream = null;
let currentCameraId = null;

/**
 * Enumerate cameras and populate the select element
 * @param {HTMLSelectElement} cameraSelect
 */
export function enumerateCameras(cameraSelect) {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    const option = document.createElement('option');
                    option.text = device.label;
                    option.value = device.deviceId;
                    cameraSelect.appendChild(option);
                }
            });
        })
        .catch(error => 
            // logError(error, 'Enumerating cameras failed')
        );
}

/**
 * Start the camera
 * @param {HTMLVideoElement} cameraFeed
 * @param {HTMLSelectElement} cameraSelect
 */
export function startCamera(cameraFeed, cameraSelect) {
    currentCameraId = cameraSelect.value;
    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: currentCameraId } } })
        .then(stream => {
            cameraStream = stream;
            cameraFeed.srcObject = stream;
            cameraFeed.play();
            document.getElementById('start-camera-btn').classList.add('d-none');
            document.getElementById('stop-camera-btn').classList.remove('d-none');
            document.getElementById('camera-feed-container').classList.remove('d-none');
        })
        .catch(error =>
            // logError(error, 'Starting camera failed')
        );
}

/**
 * Stop the camera
 * @param {HTMLVideoElement} cameraFeed
 */
export function stopCamera(cameraFeed) {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        cameraFeed.srcObject = null;
        document.getElementById('start-camera-btn').classList.remove('d-none');
        document.getElementById('stop-camera-btn').classList.add('d-none');
        document.getElementById('camera-feed-container').classList.add('d-none');
    }
}
