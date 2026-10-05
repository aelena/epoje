const pendingEl = document.getElementById('pending');
const lastEl = document.getElementById('last');

async function render() {
  const { pending = [], last_added: last } = await chrome.storage.local.get(['pending', 'last_added']);

  pendingEl.textContent = pending.length
    ? `${pending.length} waiting · open epoche to receive ${pending.length === 1 ? 'it' : 'them'}`
    : 'all fragments delivered';

  lastEl.textContent = last ? `“${last.text.length > 140 ? last.text.slice(0, 140) + '…' : last.text}”` : '';
}

document.getElementById('open').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openApp' });
  window.close();
});

chrome.storage.onChanged.addListener(render);
render();
