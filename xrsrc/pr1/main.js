import { initGL } from './utils.js';

// --- Globals ---
let xrSession = null;
let gl = null;
let xrReferenceSpace = null;
let mediaStream = null; // Camera stream
let videoElement = null;
let isARRunning = false;
let isCameraRunning = false;

// --- DOM Elements ---
let startARButton;
let stopARButton;
let cameraSelect;
let toggleCameraButton;

/**
 * Initializes the application, setting up DOM event listeners and the camera.
 */
document.addEventListener('DOMContentLoaded', () => {
    startARButton = document.getElementById('startARButton');
    stopARButton = document.getElementById('stopARButton');
    cameraSelect = document.getElementById('cameraSelect');
    toggleCameraButton = document.getElementById('toggleCameraButton');
    videoElement = document.getElementById('cameraPreview');

    startARButton.addEventListener('click', startAR);
    stopARButton.addEventListener('click', stopAR);
    toggleCameraButton.addEventListener('click', toggleCamera);
    cameraSelect.addEventListener('change', handleCameraChange);

    setupCameraSelection(); // Initial camera setup
});

// --- AR Session Functions ---

/**
 * Starts the WebXR AR session.
 * @async
 */
async function startAR() {
    console.log("Starting AR session...");
    if (isARRunning) return; // Prevent starting multiple sessions

     //Ensure camera stopped when starting AR
     stopCameraPreview();

    try {
        if (!navigator.xr) throw new Error("WebXR API not supported.");
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) throw new Error("Immersive AR not supported.");

        xrSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        await onSessionStarted();
        isARRunning = true;
        toggleARButtons();

    } catch (error) {
        console.error("Failed to start AR session:", error);
        alert(`Failed to start AR session: ${error.message}`);
    }
}
/**
 * Stops the WebXR AR Session.
 */
async function stopAR() {
    console.log("Stopping AR session...");
    if (!isARRunning || !xrSession) return;
    try{
        await xrSession.end();
    } catch(error){
        console.error("Error stopping AR session", error);
        alert(`Error stopping AR session: ${error.message}`);
    }


}

/**
 * Handles the XR session startup, initializing WebGL and starting the render loop.
 * @async
 */
async function onSessionStarted() {
    console.log("XR session started.");

    const canvas = document.getElementById('glCanvas');
	try{
       gl = canvas.getContext('webgl', { xrCompatible: true });
    } catch (error) {
        const errorMessage =`Error getting webgl context: ${error}`;
        console.error(errorMessage);
        alert(errorMessage);
    }


    if (!gl) {
        throw new Error("Failed to initialize WebGL.");
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent clear color
    gl.enable(gl.DEPTH_TEST);

    initGL(gl); // Initialize WebGL (from utils.js)

    const xrLayer = new XRWebGLLayer(xrSession, gl);
    xrSession.updateRenderState({ baseLayer: xrLayer });

    xrSession.addEventListener('end', onSessionEnded);

    xrReferenceSpace = await setupReferenceSpace();
    xrSession.requestAnimationFrame(render); // Start the render loop
}

/**
 *  Handles XR session end.
 */
function onSessionEnded() {
	console.log("XR session ended.");
	isARRunning = false;
    xrSession = null;
	gl = null;
	xrReferenceSpace = null;
	toggleARButtons();


}

/**
 * Set up requered XR reference space.
 * @returns {XRReferenceSpace}
 */
async function setupReferenceSpace(){
    try{
       return await xrSession.requestReferenceSpace('local-floor');
    } catch(error) {
        console.warn("'local-floor' reference space not available. Trying 'local'.", error)
        return  await xrSession.requestReferenceSpace('local');
    }
}

/**
 * The main render loop for WebXR.
 * @param {number} timestamp - The current time.
 * @param {XRFrame} frame - The XR frame data.
 */
function render(timestamp, frame) {
    if (!frame) {
        console.warn("No XR frame available.");
        return;
    }

    let pose = frame.getViewerPose(xrReferenceSpace);
    xrSession.requestAnimationFrame(render); // Request next frame

    if (pose) {
         let glLayer = xrSession.renderState.baseLayer;
         gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // ... (Add your 3D rendering here later) ...
    }  else {
	    console.warn("No pose available in this frame.");
	}
}

// --- Camera Preview Functions ---

/**
 * Sets up the camera selection dropdown.
 * Gets permission.
 * Populate select.
 * @async
 */
async function setupCameraSelection() {
    try {
        // Get initial permission
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        //Stop dummy stream
        tempStream.getTracks().forEach(track => track.stop());

        if (videoDevices.length === 0) {
            throw new Error("No video input devices found.");
        }
          //Clear options
        cameraSelect.innerHTML = '';

        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${cameraSelect.options.length + 1}`;
            cameraSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error setting up camera selection:", error);
        alert(`Error setting up camera selection: ${error.message}`);
    }
}

/**
 *  Handles the event when user change option on camera selection.
 */
async function  handleCameraChange() {
    if(isCameraRunning){
      await startCameraPreview(cameraSelect.value);
    }

}

/**
 * Starts/stops camera preview
 *  @async
 */
async function toggleCamera() {
    if (isCameraRunning) {
        stopCameraPreview();
    } else {
	    if(cameraSelect.value){
           await startCameraPreview(cameraSelect.value);
		} else {
			console.error('No cameras available.');
		}

    }
}

/**
 * Starts the camera preview with the selected device ID.
 * @async
 * @param {string} deviceId - The ID of the selected camera.
 */
async function startCameraPreview(deviceId) {
   try {

       stopCameraPreview(); // Stop any existing stream
       const constraints = {
            video: {
                deviceId: { exact: deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = mediaStream;

        videoElement.style.display = 'block'; // Show the video element
        toggleCameraButton.textContent = 'Stop Camera';
        isCameraRunning = true;

    } catch (error) {
        console.error("Error starting camera preview:", error);
        alert(`Error starting camera preview: ${error.message}`);
    }
}

/**
 * Stops the camera preview.
 */
function stopCameraPreview() {

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;

    }
    if(videoElement) {
       videoElement.srcObject = null;
       videoElement.style.display = 'none'; // Hide the video element
    }

    toggleCameraButton.textContent = 'Start Camera';
    isCameraRunning = false;
}

/**
 * Toggle the visibility of Start and Stop AR button.
 */
function toggleARButtons(){
    if(isARRunning) {
      startARButton.style.display = 'none';
      stopARButton.style.display = 'inline-block';
    } else {
       startARButton.style.display = 'inline-block';
      stopARButton.style.display = 'none';
    }
}
