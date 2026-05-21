/**
 * Mobile Detection and Optimization Utilities
 * Provides functions to detect mobile devices and adjust settings accordingly
 */

/**
 * Detect if the current device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check user agent
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);

    // Check screen size
    const isMobileScreen = window.innerWidth < 768;

    // Check touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return isMobileUA || (isMobileScreen && hasTouch);
}

/**
 * Detect if device is tablet
 * @returns {boolean} True if tablet device
 */
export function isTablet() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const tabletRegex = /iPad|Android(?!.*Mobile)/i;
    return tabletRegex.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth <= 1024);
}

/**
 * Get device type
 * @returns {string} 'mobile', 'tablet', or 'desktop'
 */
export function getDeviceType() {
    if (isMobileDevice() && !isTablet()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
}

/**
 * Get optimized renderer settings based on device
 * @returns {Object} Renderer configuration
 */
export function getRendererSettings() {
    const deviceType = getDeviceType();

    const settings = {
        mobile: {
            antialias: false,
            pixelRatio: Math.min(window.devicePixelRatio, 1.5),
            shadowsEnabled: false,
            powerPreference: 'low-power'
        },
        tablet: {
            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            shadowsEnabled: false,
            powerPreference: 'default'
        },
        desktop: {
            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            shadowsEnabled: true,
            powerPreference: 'high-performance'
        }
    };

    return settings[deviceType];
}

/**
 * Get optimized camera settings based on device
 * @returns {Object} Camera configuration
 */
export function getCameraSettings() {
    const deviceType = getDeviceType();

    const settings = {
        mobile: {
            fov: 60,
            position: { x: 5, y: 4, z: 8 },
            minDistance: 0.5, // Much closer for details
            maxDistance: 15
        },
        tablet: {
            fov: 50,
            position: { x: 4.5, y: 3.5, z: 7 },
            minDistance: 0.4, // Much closer for details
            maxDistance: 13
        },
        desktop: {
            fov: 45,
            position: { x: 4, y: 3, z: 6 },
            minDistance: 0.3, // Much closer for details
            maxDistance: 12
        }
    };

    return settings[deviceType];
}

/**
 * Get optimized controls settings based on device
 * @returns {Object} Controls configuration
 */
export function getControlsSettings() {
    const deviceType = getDeviceType();

    const settings = {
        mobile: {
            dampingFactor: 0.1,
            rotateSpeed: 0.5, // Slower for better control
            zoomSpeed: 1, // Slower zoom
            panSpeed: 0.3, // Slower panning
            enablePan: true
        },
        tablet: {
            dampingFactor: 0.08,
            rotateSpeed: 0.5, // Slower for better control
            zoomSpeed: 0.8,
            panSpeed: 0.5, // Slower panning
            enablePan: true
        },
        desktop: {
            dampingFactor: 0.05,
            rotateSpeed: 1.0,
            zoomSpeed: 1.0,
            panSpeed: 0.8,
            enablePan: false
        }
    };

    return settings[deviceType];
}

/**
 * Check if device supports WebGL 2
 * @returns {boolean} True if WebGL 2 is supported
 */
export function supportsWebGL2() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2'));
    } catch (e) {
        return false;
    }
}

/**
 * Get device performance tier (low, medium, high)
 * @returns {string} Performance tier
 */
export function getPerformanceTier() {
    const deviceType = getDeviceType();
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4;

    if (deviceType === 'mobile') {
        if (cores >= 6 && memory >= 4) return 'medium';
        return 'low';
    }

    if (deviceType === 'tablet') {
        if (cores >= 6 && memory >= 6) return 'high';
        return 'medium';
    }

    // Desktop
    if (cores >= 8 && memory >= 8) return 'high';
    if (cores >= 4 && memory >= 4) return 'medium';
    return 'low';
}

/**
 * Add device class to body for CSS targeting
 */
export function addDeviceClass() {
    const deviceType = getDeviceType();
    const performanceTier = getPerformanceTier();

    document.body.classList.add(`device-${deviceType}`);
    document.body.classList.add(`performance-${performanceTier}`);

    if (isMobileDevice()) {
        document.body.classList.add('is-mobile');
    }
}

/**
 * Prevent default touch behaviors that might interfere with 3D controls
 */
export function preventDefaultTouchBehaviors() {
    if (isMobileDevice()) {
        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';

        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }
}
