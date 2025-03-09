import { initGL, createCubeMesh, createShaderProgram } from './utils.js';

// Global variables
// --- WebXR Globals ---
let xrSession = null;
let gl = null;
let xrReferenceSpace = null;

// --- Camera Preview Globals ---
let mediaStream = null; // Store the camera stream
let videoElement = null;

// Entry point
document.addEventListener('DOMContentLoaded', () => {
    alert('document loaded');
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', onStartAR);

    // --- Camera Preview Setup ---
    setupCameraSelection();
    // The order is important, setup the selection before adding the event.
    const stopCameraButton = document.getElementById('stopCamera');
    stopCameraButton.addEventListener('click', stopCameraPreview);


    videoElement = document.getElementById('cameraPreview');

});

// --- WebXR Functions ---

async function onStartAR() {
    alert('onStartAR: Attempting to start AR session...');
    console.log("onStartAR: Attempting to start AR session...");

    // Stop any existing camera preview
    stopCameraPreview();

    // 1. Check for XR Feature Availability
    if (!navigator.xr) {
        const errorMessage = "WebXR API not found.  This browser does not support WebXR.";
        console.error(errorMessage);
        alert(errorMessage);
        return;
    }

    // 2. Check for 'immersive-ar' Session Support
    try {
        alert("onStartAR: Checking for immersive-ar support...");
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) {
            const errorMessage = "Immersive AR mode is not supported on this device or browser.";
            console.error(errorMessage);
            alert(errorMessage);
            return;
        }
        console.log("onStartAR: Immersive AR session supported.");
    } catch (error) {
        const errorMessage = `Error checking for immersive-ar support: ${error}`;
        console.error(errorMessage, error);
        alert(errorMessage);
        return;
    }

    // 3. Request an 'immersive-ar' XR Session
    try {
        alert("onStartAR: Requesting XR session...");
        xrSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });
        console.log("onStartAR: XR session successfully requested:", xrSession);
        onSessionStarted(); // Proceed to session setup
    } catch (error) {
        let errorMessage = `Error requesting XR session: ${error.name} - ${error.message}`;

        alert(errorMessage);
        console.error(errorMessage, error);

        // Provide more specific error messages based on common error types.
        if (error instanceof DOMException) {
            if (error.name === "NotAllowedError") {
                errorMessage += "\n\nPlease ensure you have granted the necessary permissions (camera access).";
            } else if (error.name === "InvalidStateError") {
                errorMessage += "\n\nThe application is in an invalid state to request a session.";
            }
            // Add more DOMException name checks as needed.
        }
        console.error(errorMessage, error);
        alert(errorMessage);
    }
}

function onSessionStarted() {
    console.log("onSessionStarted: Session started. Setting up...");
    alert("onSessionStarted: Session started. Setting up...");

    // 1. Hide Start Button
    const startButton = document.getElementById('startButton');
    startButton.style.display = 'none';
    console.log("onSessionStarted: Start button hidden.");
    alert("onSessionStarted: Start button hidden.");

    // 2. Initialize WebGL
    const canvas = document.getElementById('glCanvas');
    try {
        alert("onSessionStarted: Attempting to get webgl context...");
        gl = canvas.getContext('webgl', { xrCompatible: true });
    } catch (error) {
        alert("onSessionStarted: Error getting webgl context...");
        const errorMessage = `Error getting webgl context: ${error}`;
        console.error(errorMessage);
        alert(errorMessage);
    }


    if (!gl) {
        const errorMessage = "Unable to initialize WebGL. Your browser may not support it, or WebXR integration may be broken.";
        console.error(errorMessage);
        alert(errorMessage);
        return;  // Critical error: Cannot continue without WebGL.
    } else {
        alert("onSessionStarted: WebGL initialized.");
    }

    // Set clear color and enable depth testing
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    initGL(gl); // For future use
    alert("onSessionStarted: WebGL initialized.");
    console.log("onSessionStarted: WebGL initialized.");

    // 3. Set XRWebGLLayer as the Base Layer
    try {
        const xrLayer = new XRWebGLLayer(xrSession, gl);
        xrSession.updateRenderState({ baseLayer: xrLayer });
        alert("onSessionStarted: XRWebGLLayer created and set as base layer.");
        console.log("onSessionStarted: XRWebGLLayer created and set as base layer.");
    } catch (error) {
        const errorMessage = `Error creating or setting XRWebGLLayer: ${error}`;
        console.error(errorMessage, error);
        alert(errorMessage);
        // Consider ending the session here, as rendering will likely fail.
        xrSession.end();
        return;
    }

    // 4. Handle Session End
    xrSession.addEventListener('end', onSessionEnded);
    console.log("onSessionStarted: 'end' event listener added.");

    // 5. Start Render Loop (placeholder for now)
    // xrSession.requestAnimationFrame(render);
    // console.log("onSessionStarted: Render loop initiated.");

    // 5. Request Reference Space
    setupReferenceSpace().then(() => {
        // 6. Start Render Loop (Now that we have a reference space)
        xrSession.requestAnimationFrame(render);
        alert("onSessionStarted: Render loop initiated.");
        console.log("onSessionStarted: Render loop initiated.");

    });
}

async function setupReferenceSpace() {
    try {
        xrReferenceSpace = await xrSession.requestReferenceSpace('local-floor');
        alert("setupReferenceSpace: 'local-floor' reference space obtained.");
        console.log("setupReferenceSpace: 'local-floor' reference space obtained.");
    } catch (error) {
        // If 'local-floor' is not available, try 'local'
        alert("setupReferenceSpace: 'local-floor' reference space not available, trying 'local'...");
        console.warn("setupReferenceSpace: 'local-floor' reference space not available, trying 'local'...", error);
        try {
            xrReferenceSpace = await xrSession.requestReferenceSpace('local');
            if(xrReferenceSpace){
                alert("setupReferenceSpace: 'local' reference space obtained.");
                console.log("setupReferenceSpace: 'local' reference space obtained.");
            }
        } catch (localError) {
            const errorMessage = `Error requesting reference space: ${localError}`;
            console.error(errorMessage, localError);
            alert(errorMessage);
            xrSession.end(); // End the session if we can't get a reference space.
        }
    }
}

function onSessionEnded() {
    alert("onSessionEnded: Session ended.");
    console.log("onSessionEnded: Session ended.");
    xrSession = null;
    gl = null;
    xrReferenceSpace = null;
    // You might want to re-display the "Start AR" button here
    const startButton = document.getElementById('startButton');
    startButton.style.display = 'block';
}

function render(timestamp, frame) {
    if (!frame) {
        console.log("render: No frame available.");
        alert("render: No frame available. Stopping session.")
        return;
    }

    // Get the pose of the viewer relative to the reference space.
    let pose = frame.getViewerPose(xrReferenceSpace);

    // Schedule the next frame
    xrSession.requestAnimationFrame(render);

    if (pose) {
        let glLayer = xrSession.renderState.baseLayer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
}


// --- Camera Preview Functions ---

async function setupCameraSelection() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        alert(JSON.stringify(devices));
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
            throw new Error("No video input devices found.");
        }

        const cameraSelect = document.getElementById('cameraSelect');
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
        });

        // Start with the first camera by default.
        startCameraPreview(videoDevices[0].deviceId);

        // Update the camera preview when the selection changes.
        cameraSelect.addEventListener('change', () => {
            startCameraPreview(cameraSelect.value);
        });

    } catch (error) {
        console.error("Error setting up camera selection:", error);
        alert(`Error setting up camera selection: ${error.message}`);
    }
}
async function startCameraPreview(deviceId) {
    // Stop any existing stream before starting a new one.
    stopCameraPreview();

    try {
        const constraints = {
            video: {
                deviceId: { exact: deviceId },  // Use 'exact' to specify the deviceId
                width: { ideal: 640 },       // Request a specific resolution (optional)
                height: { ideal: 480 }
            }
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = mediaStream;
        videoElement.play(); // Ensure it plays, sometimes autoplay doesn't work

    } catch (error) {
        console.error("Error starting camera preview:", error);
         alert(`Error starting camera preview: ${error.message}`);
    }
}

function stopCameraPreview() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        videoElement.srcObject = null; // Clear the srcObject
    }
}