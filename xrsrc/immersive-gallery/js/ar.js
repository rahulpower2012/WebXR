/**
 * AR handling for the WebXR project
 * @module ar
 */

import { logError } from './utils.js';

let xrSession = null;
let xrReferenceSpace = null;
let scene = null;
let camera = null;
let renderer = null;

/**
 * Initialize the AR scene
 */
export function initAR() {
    try{

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('ar-container'),
            antialias: true
        });
    
        // Create a simple cube
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.z = -0.5;
        scene.add(cube);
    } catch(error){
        // logError(error, 'initAR failed');
    }
}

/**
 * Start the AR session
 * @param {HTMLVideoElement} cameraFeed
 */
export async function startAR(cameraFeed) {
    await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
        // optionalFeatures: ['hand-tracking']
    })
        .then(session => {
            xrSession = session;
            session.addEventListener('end', onXRSessionEnded);
            initAR();
            session.requestReferenceSpace('local')
                .then(referenceSpace => {
                    xrReferenceSpace = referenceSpace;
                    session.requestAnimationFrame(render);
                    document.getElementById('start-ar-btn').classList.add('d-none');
                    document.getElementById('stop-ar-btn').classList.remove('d-none');
                    document.getElementById('ar-container').classList.remove('d-none');
                }).catch(
                    (error)=>{
                        session.requestReferenceSpace('local-floor')
                .then(referenceSpace => {
                    xrReferenceSpace = referenceSpace;
                    session.requestAnimationFrame(render);
                    document.getElementById('start-ar-btn').classList.add('d-none');
                    document.getElementById('stop-ar-btn').classList.remove('d-none');
                    document.getElementById('ar-container').classList.remove('d-none');
                })
                    }
                );
        })
        .catch(error => 
            // logError(error, 'Starting AR session failed')
        );
}

/**
 * Stop the AR session
 */
export function stopAR() {
    if (xrSession) {
        xrSession.end();
        xrSession = null;
        document.getElementById('start-ar-btn').classList.remove('d-none');
        document.getElementById('stop-ar-btn').classList.add('d-none');
        document.getElementById('ar-container').classList.add('d-none');
    }
}

/**
 * Render the AR scene
 * @param {number} timestamp
 * @param {XRPose} frame
 */
function render(timestamp, frame) {
    try{

        if (frame) {
            const pose = frame.getViewerPose(xrReferenceSpace);
            if (pose) {
                const viewMatrix = new THREE.Matrix4();
                viewMatrix.fromArray(pose.transform.matrix);
                camera.matrix = viewMatrix;
                camera.quaternion.setFromRotationMatrix(camera.matrix);
                camera.position.copy(camera.matrix.position);
                renderer.render(scene, camera);
            }
        }
        xrSession.requestAnimationFrame(render);
    } catch(error){
        // logError(error, 'render failed');
    }
}

/**
 * Event handler for XR session end
 * @param {Event} event
 */
function onXRSessionEnded(event) {
    console.log('XR session ended:', event);
    xrSession = null;
}
