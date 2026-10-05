// Captured fragments wait in `pending` until an open epoche tab takes them
// (see bridge.js). Nothing is sent to any server.
const APP_URL = 'http://localhost:3000';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-to-reservoir',
    title: 'Add to reservoir',
    contexts: ['selection'],
  });
});

function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'add-to-reservoir') return;

  const text = (info.selectionText || '').trim().slice(0, 2000);
  if (!text) return;

  const item = {
    id: crypto.randomUUID(),
    text,
    source_url: info.pageUrl || tab?.url || undefined,
    source_title: tab?.title || undefined,
    created_at: new Date().toISOString(),
  };

  const { pending = [] } = await chrome.storage.local.get('pending');
  pending.push(item);
  await chrome.storage.local.set({ pending, last_added: item });

  notify(
    'Added to reservoir',
    text.length > 60 ? `${text.substring(0, 60)}...` : text,
  );
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'openApp') {
    chrome.tabs.create({ url: APP_URL });
    sendResponse({ ok: true });
  }
});
