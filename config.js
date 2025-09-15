// Configuration module for environment variables
// This file should be updated with your actual keys before deployment

const CONFIG = {
    // Cloudflare Turnstile Configuration
    TURNSTILE_SITE_KEY: '0x4AAAAAABxPUXr36M_oikVR', // Production site key
    TURNSTILE_SECRET_KEY: '0x4AAAAAABxPUVWFhDqhSEL_HfStE3mJDT0', // Production secret key for server-side validation
    
    // Development mode flag
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // API endpoints (if needed in the future)
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://yourdomain.com/api'
};

// Export configuration for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

// Log configuration in development mode
if (CONFIG.IS_DEVELOPMENT) {
    console.log('Configuration loaded:', {
        ...CONFIG,
        TURNSTILE_SITE_KEY: CONFIG.TURNSTILE_SITE_KEY.substring(0, 10) + '...' // Hide full key in logs
    });
}