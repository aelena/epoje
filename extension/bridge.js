// Runs inside the epoche web app. Hands queued fragments to the page, which
// stores them in its own localStorage and acknowledges by id.

async function deliver() {
  const { pending = [] } = await chrome.storage.local.get('pending');
  if (pending.length) {
    window.postMessage({ type: 'epoche:reservoir-add', items: pending }, window.location.origin);
  }
}

window.addEventListener('message', async (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data;

  if (data?.type === 'epoche:ready') {
    deliver();
  }

  if (data?.type === 'epoche:reservoir-ack' && Array.isArray(data.ids)) {
    const acked = new Set(data.ids);
    const { pending = [] } = await chrome.storage.local.get('pending');
    await chrome.storage.local.set({ pending: pending.filter((i) => !acked.has(i.id)) });
  }
});

// New captures while the app is open arrive immediately
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.pending?.newValue?.length) deliver();
});

deliver();
