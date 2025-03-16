/**
 * @module camera
 * Handles camera preview and selection using the MediaDevices API.
 */

/**
 * Sets up the camera selection dropdown, populating it with available video input devices.
 * @async
 * @param {HTMLSelectElement} cameraSelect - The select element for camera selection.
 */
export async function setupCameraSelection(cameraSelect) {
    try {
        // Request initial permission to access media devices.
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

        // Enumerate available devices.
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Stop the temporary stream to release the camera.
        tempStream.getTracks().forEach(track => track.stop());

        if (videoDevices.length === 0) {
            throw new Error("No video input devices found.");
        }

        // Clear any existing options in the select element.
        cameraSelect.innerHTML = '';

        // Populate the select element with options for each video device.
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${cameraSelect.options.length + 1}`;
            cameraSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error setting up camera selection:", error);
        alert(`Error setting up camera selection: ${error.message}`); // Provide user feedback
    }
}

/**
 * Handles the change event of the camera selection dropdown, restarting the camera preview.
 * @async
 */
export async function handleCameraChange() {
	const cameraSelect = document.getElementById('cameraSelect');
	const videoElement = document.getElementById('cameraPreview');
	const toggleCameraButton = document.getElementById('toggleCameraButton');

    const isCameraRunning = toggleCameraButton.textContent === 'Stop Camera';
    if(isCameraRunning){
      await startCameraPreview(cameraSelect.value, videoElement, toggleCameraButton );
    }
}

/**
 * Starts the camera preview with the specified device ID.
 * @async
 * @param {string} deviceId - The ID of the camera to use.
 *  @param {HTMLVideoElement} videoElement - The video element.
 * @param {HTMLButtonElement} toggleCameraButton - the toggle camera element
 */
export async function startCameraPreview(deviceId, videoElement, toggleCameraButton ) {
    try {
        stopCameraPreview(videoElement, toggleCameraButton ); // Always stop any existing streams first.

        const constraints = {
            video: {
                deviceId: { exact: deviceId }, // Request the specific camera.
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
			audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = mediaStream;
        videoElement.style.display = 'block'; // Make the video element visible.
        toggleCameraButton.textContent = 'Stop Camera';

    } catch (error) {
        console.error("Error starting camera preview:", error);
        alert(`Error starting camera preview: ${error.message}`); // Provide user feedback.
    }
}

/**
 * Stops the camera preview.
 *  @param {HTMLVideoElement} videoElement - The video element.
 * @param {HTMLButtonElement} toggleCameraButton - the toggle camera element.
 */
export function stopCameraPreview(videoElement, toggleCameraButton) {

	 if (videoElement.srcObject) {
        const stream = videoElement.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
	 videoElement.style.display = 'none';
     toggleCameraButton.textContent = 'Start Camera';
}
