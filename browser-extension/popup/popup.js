// Configuration
const API_BASE_URL = 'https://mindweave.space';

// DOM Elements
const loadingState = document.getElementById('loading');
const loginRequiredState = document.getElementById('login-required');
const captureFormState = document.getElementById('capture-form');
const successState = document.getElementById('success');
const errorState = document.getElementById('error');

const loginBtn = document.getElementById('login-btn');
const saveForm = document.getElementById('save-form');
const saveBtn = document.getElementById('save-btn');
const retryBtn = document.getElementById('retry-btn');
const viewLibraryBtn = document.getElementById('view-library-btn');
const openMindweaveLink = document.getElementById('open-mindweave');

const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const bodyInput = document.getElementById('body');
const tagsInput = document.getElementById('tags');
const userNameEl = document.getElementById('user-name');
const errorMessageEl = document.getElementById('error-message');

// State
let currentUser = null;
let currentTab = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Set the Mindweave link
  openMindweaveLink.href = API_BASE_URL;

  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
  } catch (error) {
    console.error('Failed to get current tab:', error);
  }

  // Check authentication
  await checkAuth();
}

async function checkAuth() {
  showState('loading');

  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.authenticated && data.user) {
      currentUser = data.user;
      showCaptureForm();
    } else {
      showState('login-required');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showState('login-required');
  }
}

function showCaptureForm() {
  // Set user name
  userNameEl.textContent = currentUser.name || currentUser.email;

  // Pre-fill form with current tab info
  if (currentTab) {
    titleInput.value = currentTab.title || '';
    urlInput.value = currentTab.url || '';
  }

  showState('capture-form');
}

function showState(stateName) {
  // Hide all states
  loadingState.classList.add('hidden');
  loginRequiredState.classList.add('hidden');
  captureFormState.classList.add('hidden');
  successState.classList.add('hidden');
  errorState.classList.add('hidden');

  // Show the requested state
  switch (stateName) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'login-required':
      loginRequiredState.classList.remove('hidden');
      break;
    case 'capture-form':
      captureFormState.classList.remove('hidden');
      break;
    case 'success':
      successState.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
  }
}

function showError(message) {
  errorMessageEl.textContent = message;
  showState('error');
}

function setLoading(isLoading) {
  const btnText = saveBtn.querySelector('.btn-text');
  const btnLoading = saveBtn.querySelector('.btn-loading');

  if (isLoading) {
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    saveBtn.disabled = true;
  } else {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    saveBtn.disabled = false;
  }
}

async function saveContent() {
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const body = bodyInput.value.trim();
  const tagsStr = tagsInput.value.trim();

  // Validate
  if (!title) {
    alert('Title is required');
    titleInput.focus();
    return;
  }

  // Parse tags
  const tags = tagsStr
    ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/capture`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        type: 'link',
        title,
        url: url || undefined,
        body: body || undefined,
        tags,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showState('success');
    } else {
      showError(data.message || 'Failed to save content');
    }
  } catch (error) {
    console.error('Save failed:', error);
    showError('Network error. Please check your connection.');
  } finally {
    setLoading(false);
  }
}

// Event Listeners
loginBtn.addEventListener('click', () => {
  // Open Mindweave login page in new tab
  chrome.tabs.create({ url: `${API_BASE_URL}/login` });
  // Close popup
  window.close();
});

saveForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveContent();
});

retryBtn.addEventListener('click', () => {
  showCaptureForm();
});

viewLibraryBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}/dashboard/library` });
  window.close();
});
