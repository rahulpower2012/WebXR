/**
 *  @module xr
 * Handles WebXR AR session management and rendering using Three.js.
 */
// import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Module-Level Variables ---
let xrSession = null;
let renderer = null;
let scene = null;
let camera = null;
let xrReferenceSpace = null;
let cube = null;
let hitTestSource = null;
let hitTestActive = false;


// --- WebXR Session Management ---

/**
 * Starts the WebXR AR session.
 * @async
 */
export async function startAR(startARButton, stopARButton) {
    console.log("Starting AR session...");

    try {
        if (!navigator.xr) throw new Error("WebXR API not supported.");

        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) throw new Error("Immersive AR not supported.");

        xrSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        await onSessionStarted(startARButton, stopARButton);

    } catch (error) {
        console.error("Failed to start AR session:", error);
        alert(`Failed to start AR session: ${error.message}`);
        // Consider additional error handling (e.g., disabling AR button).
    }
}
/**
 * Handle the session end event.
 */
export async function stopAR(startARButton, stopARButton) {
        if(!xrSession) return;

    console.log("Stopping AR session...");
    try {
        await xrSession.end();
    } catch (error) {
         console.log("stopping AR session failed", error);
    }
}

/**
 * Initializes Three.js scene, renderer, camera, and XR session settings.
 */
export function initXR() { // Call this *before* attempting startAR()
    // Three.js Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true // Important for transparent background with AR passthrough
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;   // Enable WebXR rendering
    renderer.xr.setReferenceSpaceType('local'); // Or 'local-floor', if available and desired.

    //For debug only
    //const controls = new OrbitControls( camera, renderer.domElement );

    document.body.appendChild(renderer.domElement);  // Three.js creates and manages the canvas.

       // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

/**
 * Handles the XR session start: sets up event listeners, reference space, and hit testing.
 * @async
 */
async function onSessionStarted(startARButton, stopARButton) {

    toggleARButtons(startARButton, stopARButton,  true);
    xrSession.addEventListener('end', () => onSessionEnded(startARButton, stopARButton));

     renderer.xr.setSession(xrSession); // Connect Three.js renderer to XR session

    // Setup Three.js scene (cube, lights, etc.)
    setupThreeJsScene();

    xrReferenceSpace = await setupReferenceSpace();
    // Request Hit Test Source:
    await requestHitTestSource();

    xrSession.addEventListener('select', onSelect);  // Set up select event (tap/click)

    xrSession.requestAnimationFrame(render);   // Start the render loop.
}

/**
 * Handles XR session end: cleanup.
 */
function onSessionEnded(startARButton, stopARButton) {

    toggleARButtons(startARButton, stopARButton, false);

     if (renderer) {
       renderer.dispose(); // Dispose Three.js renderer
    }
	// Reset module-level variables
    xrSession = null;
    renderer = null;
    scene = null;
    camera = null;
    xrReferenceSpace = null; // Reset XR reference space
    hitTestSource = null;    // Reset hit test source
    hitTestActive = false;    // Reset hit test active flag


    console.log("XR session ended.");
}

// --- Three.js Scene Setup ---

/**
 * Sets up the Three.js scene, including a cube and lighting.
 */
function setupThreeJsScene() {
   // Create a simple cube (replace with your models)
   const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2); // 20cm cube
   const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
   cube = new THREE.Mesh(geometry, material);
   scene.add(cube);
   //Initially make it invisible
   cube.visible = false;

   // Add some lighting (important for MeshBasicMaterial to be visible if not using flat shading)
   const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
   scene.add(light);
}

// --- Render Loop ---
/**
 * The main render loop. Called every frame by requestAnimationFrame.
 * @param {number} timestamp
 * @param {XRFrame} frame
 */
function render(timestamp, frame) {

    if (!frame) { return; } // No frame?  Exit

    let pose = frame.getViewerPose(xrReferenceSpace);
    xrSession.requestAnimationFrame(render);

    if(pose){
      // Hit test
      const hitTestResults = performHitTest(frame); // Get hit test results

      if (hitTestResults && hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const hitPose = hit.getPose(xrReferenceSpace);

          // Position the cube at the hit test location
          if(hitPose){ // alwas check if is not null
             cube.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
             cube.visible = true; // Make the cube visible
          }
        }
      }
    renderer.render(scene, camera); // Render the Three.js scene
}

/**
 * Set XR reference space.
 *
 */
async function setupReferenceSpace(){
    try{
       return await xrSession.requestReferenceSpace('local-floor');
    } catch(error) {
        console.warn("'local-floor' reference space not available. Trying 'local'.", error)
        return await xrSession.requestReferenceSpace('local');
    }
}
// --- Hit Testing ---

/**
 * Requests an XRHitTestSource for use in hit testing.
 * @async
 */
async function requestHitTestSource() {
  try {
        const options = {
          space: xrReferenceSpace,
          offsetRay: new XRRay()
      };

    hitTestSource = await xrSession.requestHitTestSource(options);
    hitTestActive = true;

    console.log("Hit test source created successfully.");
  } catch (error) {
    console.error("Failed to create hit test source:", error);
    hitTestActive = false;  // Ensure state is consistent on failure
  }
}

/**
 * Performs a hit test in the current frame.
 * @param {XRFrame} frame - The current XR frame.
 * @returns {XRHitTestResult[] | null} - The hit test results, or null if no hit testing occurred.
 */
function performHitTest(frame) {
    if (hitTestActive && hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
           return hitTestResults;
        }
    }
    return null;  // No hit test results
}

/**
 *  Handles 'select' event by activate hit testing process
 */
function onSelect() {
      hitTestActive = true;
}

// --- Utility Functions ---

/**
 * Handles window resizing.
 */
function onWindowResize() {
    if (camera && renderer) { // Check if camera and renderer exist
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
/**
 * Toggle the visibility of Start and Stop AR button.
 */
function toggleARButtons(startARButton, stopARButton, isARRunning){
    if(isARRunning) {
      startARButton.style.display = 'none';
      stopARButton.style.display = 'inline-block';
    } else {
       startARButton.style.display = 'inline-block';
      stopARButton.style.display = 'none';
    }
}
// Export functions needed by main.js
// export { startAR, stopAR, initXR };

