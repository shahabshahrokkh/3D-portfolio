/**
 * Central Controls Manager
 * Manages enabling/disabling of OrbitControls and Raycaster interactions
 * when overlays (Projects, Arcade, Contact) are open
 */

let orbitControls = null;
let raycasterEnabled = true;

/**
 * Initialize the controls manager with references
 */
export function initControlsManager(controls) {
    orbitControls = controls;
}

/**
 * Disable all 3D scene interactions
 * Called when overlays open (Projects, Arcade, Contact)
 */
export function disableControls() {
    if (orbitControls) {
        orbitControls.enabled = false;
    }
    raycasterEnabled = false;
}

/**
 * Enable all 3D scene interactions
 * Called when overlays close
 */
export function enableControls() {
    if (orbitControls) {
        orbitControls.enabled = true;
    }
    raycasterEnabled = true;
}

/**
 * Check if raycaster interactions are allowed
 */
export function isRaycasterEnabled() {
    return raycasterEnabled;
}
