/**
 * Mindweave Browser Extension - Background Service Worker
 * Handles API calls and cookie-based authentication
 */

const API_BASE_URL = 'http://localhost:3004'; // Change to production URL when deploying

/**
 * Check if user is authenticated with Mindweave
 * @returns {Promise<{authenticated: boolean, user?: object}>}
 */
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false };
  }
}

/**
 * Save content to Mindweave
 * @param {object} data - Content data to save
 * @returns {Promise<{success: boolean, message: string, data?: object}>}
 */
async function saveContent(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/capture`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error('Save content failed:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    checkAuth().then(sendResponse);
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'saveContent') {
    saveContent(request.data).then(sendResponse);
    return true;
  }

  return false;
});

// Optional: Handle extension icon click for quick save (badge feedback)
chrome.action.onClicked.addListener(async (tab) => {
  // This won't fire when popup is configured, but useful if popup is removed
  // For now, the popup handles everything
});

// Log when service worker starts
console.log('Mindweave extension service worker started');
