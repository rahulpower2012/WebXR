import { logError, setUpLogging } from '../utils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'; // Import FontLoader
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'; // Import TextGeometry
/**
 *  @module xr
 * Handles WebXR AR session management and rendering using Three.js.
 */

// --- Module-Level Variables ---
let xrSession = null;
let renderer = null;
let scene = null;
let camera = null;
let xrReferenceSpace = null;
let cube = null;
let hitTestSource = null;
let hitTestActive = false;
let textMesh = null;  // Store the text mesh globally within xr.js
let font = null;     //Store the font for reuse
// --- Font Loading (as a Promise) ---

/**
 * Loads the font asynchronously.
 * @returns {Promise<THREE.Font>} A promise that resolves with the loaded font.
 */
export function loadFont(url) {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load(
      url,
      (loadedFont) => {
        console.log("Font loaded successfully (inside loadFont):", loadedFont); // ADD THIS
        logError(loadedFont, "Font loaded successfully (inside loadFont):"); // ADD THIS
        resolve(loadedFont); // Resolve the promise
        // if (fontLoadedCallback) {
        //   fontLoadedCallback(); // Call the callback!!!!!
        // }

      },
      undefined, // onProgress (optional)
      (error) => {
        console.error("Font loading failed (inside loadFont):", error);
        logError(JSON.stringify({error: error}), "Font loading failed (inside loadFont):");
        reject(error);
      }   // Reject the promise
    );
  });
}


// --- WebXR Session Management ---

/**
 * Starts the WebXR AR session.
 * @async
 */
export async function startAR(startARButton, stopARButton, textToAdd) {
  if(!camera || !scene || !renderer){
    await init3jsXR(textToAdd);
    logError('From startAR init3jsXR', 'init3jsXR');
  }
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
  if (!xrSession) return;

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
export async function init3jsXR(textToAdd = undefined) { // Call this *before* attempting startAR()
  // Three.js Setup
  try {

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

    if(!font){
      try {
        font = await loadFont('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json');
          if(font){
            logError(JSON.stringify({ message: 'Font loaded successfully!' }), 'Font');
            console.log("Font loaded successfully!");
          }
      } catch (error) {
        console.error("Failed to load font:", error);
        // Handle font loading failure (e.g., show an error message, disable AR features)
        alert("Failed to load font: AR text will not be available."); // User feedback.
        return; // Prevent further XR setup if crucial font is missing.
      }
  
  
      // Handle window resize
      window.addEventListener('resize', onWindowResize);
    }
  } catch (error) {
    logError(error, 'init3jsXR failed')
  } finally {
    if(!textMesh){
      await addTextToScene(textToAdd)
    }
  }
}

/**
 * Handles the XR session start: sets up event listeners, reference space, and hit testing.
 * @async
 */
async function onSessionStarted(startARButton, stopARButton) {

  toggleARButtons(startARButton, stopARButton, true);
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
  textMesh = null;


  console.log("XR session ended.");
}

// --- Three.js Scene Setup ---

/**
 * Sets up the Three.js scene, including a cube and lighting.
 */
function setupThreeJsScene() {
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

  try {

    if (!frame) { return; } // No frame?  Exit

    let pose = frame.getViewerPose(xrReferenceSpace);
    xrSession.requestAnimationFrame(render);

    if (pose) {
      // Hit test
      updateTextMeshPosition(frame);
      renderer.render(scene, camera); // Render the Three.js scene
    }
  } catch (error) {
    logError(error, 'Error from render()')
  }
}

/**
 * Set XR reference space.
 *
 */
async function setupReferenceSpace() {
  try {
    return await xrSession.requestReferenceSpace('local-floor');
  } catch (error) {
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
    logError(error, 'requestHitTestSource');
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
  logError('in onselect', 'tap event');
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
function toggleARButtons(startARButton, stopARButton, isARRunning) {
  if (isARRunning) {
    startARButton.style.display = 'none';
    stopARButton.style.display = 'inline-block';
  } else {
    startARButton.style.display = 'inline-block';
    stopARButton.style.display = 'none';
  }
}

/**
 * Adds text to the AR scene at the last hit-test position.
 * @param {string} text - The text to add.
 */
export async function addTextToScene(text) {

  try {
    // logError(JSON.stringify({message:{loadedF: font}}), 'font in addTextToScence');
    if (!font) {
      logError('addTextToScene', 'failed no font');
      console.warn("Font not loaded yet.  Cannot add text.");
      return; // Exit if no font yet.
    }

    // Remove the previous text mesh, if itexists
    if (textMesh) {
      scene.remove(textMesh);
      textMesh.geometry.dispose(); // Important for memory management
      textMesh.material.dispose();
      logError('addtexttoscence textNesh', 'addtexttoscence textNesh');
    }

    const textGeometry = new TextGeometry(text, {
      font: font,
      size: 0.2, // Adjust as needed
      height: 0.05, // Adjust as needed
      curveSegments: 12,
      bevelEnabled: false, // Set to 'true' for beveled edges
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.name = "userText";

    textGeometry.computeBoundingBox(); // For centering
    textGeometry.translate(
      -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x),
      -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y),
      -0.5 * (textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z)
    );
    // logError(JSON.stringify(textMesh), 'addtexttoscence text mesh generated');
    scene.add(textMesh);
    hitTestActive = true; //Trigger hit test.
  } catch (error) {
    logError(error, 'failed to add text');
  }

}


/**
 * Updates textMesh position based on hitTest. Separate function to
 * improve code reusability.
 * It handles the visibility.
 */
function updateTextMeshPosition(frame) {
  if (!textMesh) { return; } // Exit if no text
  const hitTestResults = performHitTest(frame);
  if (hitTestResults && hitTestResults.length > 0) {
    const hit = hitTestResults[0];
    const hitPose = hit.getPose(xrReferenceSpace);

    if (hitPose) {
      textMesh.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
      textMesh.visible = true;
    }
  } else {
    textMesh.visible = true; // Hide it when hit test fails
  }
}
