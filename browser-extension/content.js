/**
 * Mindweave Content Script — Selection Detection + Floating Save Button
 * Runs on all pages at document_idle via manifest content_scripts.
 */
(function () {
  'use strict';

  let floatingBtn = null;

  function createFloatingButton() {
    const btn = document.createElement('div');
    btn.id = 'mindweave-clip-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Save highlight to Mindweave');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    btn.style.display = 'none';
    document.documentElement.appendChild(btn);
    return btn;
  }

  function showButton(x, y) {
    if (!floatingBtn) {
      floatingBtn = createFloatingButton();
    }

    // Position near selection end, offset slightly right and above
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    floatingBtn.style.left = `${x + scrollX + 8}px`;
    floatingBtn.style.top = `${y + scrollY - 40}px`;
    floatingBtn.className = '';
    floatingBtn.style.display = 'flex';
  }

  function hideButton() {
    if (floatingBtn) {
      floatingBtn.style.display = 'none';
    }
  }

  function getSelectedText() {
    const sel = window.getSelection();
    return sel ? sel.toString().trim() : '';
  }

  function buildClipBody(text) {
    const title = document.title || location.hostname;
    const url = location.href;
    return `${text}\n\n---\n*Clipped from [${title}](${url})*`;
  }

  // Show floating button on text selection
  document.addEventListener('mouseup', function (e) {
    // Ignore clicks on the button itself
    if (floatingBtn && floatingBtn.contains(e.target)) return;

    const text = getSelectedText();
    if (text.length > 0) {
      showButton(e.clientX, e.clientY);
    } else {
      hideButton();
    }
  });

  // Hide on mousedown elsewhere (but not on the button)
  document.addEventListener('mousedown', function (e) {
    if (floatingBtn && !floatingBtn.contains(e.target)) {
      hideButton();
    }
  });

  // Handle button click — save clip via background
  document.addEventListener('click', function (e) {
    if (!floatingBtn || !floatingBtn.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    const text = getSelectedText();
    if (!text) {
      hideButton();
      return;
    }

    const pageTitle = document.title || location.hostname;
    const clipData = {
      type: 'note',
      title: `Clip from ${pageTitle}`,
      body: buildClipBody(text),
      tags: ['web-clip'],
    };

    // Show saving state
    floatingBtn.classList.add('mindweave-clip-saving');

    chrome.runtime.sendMessage({ action: 'quickClip', data: clipData }, function (response) {
      if (chrome.runtime.lastError) {
        floatingBtn.classList.remove('mindweave-clip-saving');
        floatingBtn.classList.add('mindweave-clip-error');
        setTimeout(hideButton, 1500);
        return;
      }

      floatingBtn.classList.remove('mindweave-clip-saving');
      if (response && response.success) {
        floatingBtn.classList.add('mindweave-clip-success');
      } else {
        floatingBtn.classList.add('mindweave-clip-error');
      }
      setTimeout(hideButton, 1500);
    });
  }, true);

  // Respond to getSelection messages from popup
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getSelection') {
      sendResponse({ text: getSelectedText() });
    }
    return false;
  });
})();
