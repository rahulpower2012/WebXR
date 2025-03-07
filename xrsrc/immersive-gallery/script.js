// Entry point
document.addEventListener('DOMContentLoaded', () => {
    onStartAR();
});


async function onStartAR(){
    // Check if WebXR is supported
    if (navigator && ('xr' in navigator) && (await navigator.xr.isSessionSupported('immersive-vr'))) {
        // const supported = await navigator.xr.isSessionSupported('immersive-vr');
        // if(supported){
        //     alert('Supported');
        // }
        alert('WebXR is supported');
        console.log('WebXR is supported');
        navigator.xr.requestPermission()
            .then(permissionGranted => {
                if (permissionGranted === 'granted') {
                    alert('WebXR permission granted');
                    console.log('WebXR permission granted');
                    initXRSession();
                } else {
                    alert('WebXR permission denied');
                    console.log('WebXR permission denied');
                }
            })
            .catch(error => {
                alert('Error requesting WebXR permission');
                console.error('Error requesting WebXR permission:', error);
            });
    } else {
        alert('WebXR is not supported');
        console.log('WebXR is not supported');
    }
}

// Function to initialize WebXR session
async function initXRSession() {
    try {
        const session = await navigator.xr.requestSession('immersive-vr', {
            requiredFeatures: ['local-floor', 'bounded-floor'],
            optionalFeatures: ['local-floor', 'bounded-floor']
        });
        alert('WebXR session initialized');
        console.log('WebXR session initialized:', session);
        // Handle session here (we'll add more in the next steps)
    } catch (error) {
        alert('Error initializing WebXR session');
        console.error('Error initializing WebXR session:', error);
    }
}
