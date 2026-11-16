/**
 * ENECTRON Frontend API Configuration
 * 
 * LOCAL DEVELOPMENT:
 * Leave window.ENV_API_URL empty — the frontend automatically
 * detects localhost and uses http://localhost:5000.
 * 
 * PRODUCTION (Render single-server):
 * Leave empty — Express serves both frontend and API on the same origin,
 * so fetch('/api/enquiry') works with a relative URL.
 * 
 * PRODUCTION (separate frontend and backend):
 * Set your Render backend URL, e.g.:
 *   window.ENV_API_URL = "https://enectron-api.onrender.com";
 */
window.ENV_API_URL = "";
