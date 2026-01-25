const API_BASE = 'http://localhost:8000';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-to-reservoir',
    title: 'Add to reservoir',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-to-reservoir' && info.selectionText) {
    const text = info.selectionText.trim();
    const sourceUrl = tab?.url || '';
    const sourceTitle = tab?.title || '';

    try {
      const response = await fetch(`${API_BASE}/api/reservoir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          source_url: sourceUrl,
          source_title: sourceTitle,
        }),
      });

      if (response.ok) {
        // Store success for popup feedback
        await chrome.storage.local.set({
          lastAdded: {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            timestamp: Date.now(),
            success: true,
          }
        });

        // Show badge briefly
        chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#4a7c59' });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '', tabId: tab.id });
        }, 2000);
      } else {
        throw new Error('Failed to add to reservoir');
      }
    } catch (error) {
      console.error('Error adding to reservoir:', error);

      await chrome.storage.local.set({
        lastAdded: {
          text: text.substring(0, 100),
          timestamp: Date.now(),
          success: false,
          error: error.message,
        }
      });

      chrome.action.setBadgeText({ text: '!', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#c45' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }, 2000);
    }
  }
});
