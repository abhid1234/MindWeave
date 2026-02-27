/**
 * Mindweave Browser Extension - Background Service Worker
 * Handles API calls, cookie-based authentication, context menu, and quick-clip
 */

const API_BASE_URL = 'https://mindweave.space';

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

/**
 * Show badge feedback on the extension icon
 * @param {boolean} success
 */
function showBadgeFeedback(success) {
  const text = success ? '\u2713' : '\u2717';
  const color = success ? '#10b981' : '#ef4444';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
}

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'mindweave-save-highlight',
    title: 'Save Highlight to Mindweave',
    contexts: ['selection'],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'mindweave-save-highlight') return;

  const selectedText = info.selectionText || '';
  if (!selectedText) return;

  const pageTitle = tab?.title || 'Untitled';
  const pageUrl = tab?.url || '';
  const body = `${selectedText}\n\n---\n*Clipped from [${pageTitle}](${pageUrl})*`;

  const result = await saveContent({
    type: 'note',
    title: `Clip from ${pageTitle}`,
    body,
    tags: ['web-clip'],
  });

  showBadgeFeedback(result.success);
});

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    checkAuth().then(sendResponse);
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'saveContent') {
    saveContent(request.data).then(sendResponse);
    return true;
  }

  if (request.action === 'quickClip') {
    saveContent(request.data).then(sendResponse);
    return true;
  }

  return false;
});

// Log when service worker starts
console.log('Mindweave extension service worker started');
