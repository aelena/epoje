const DEFAULT_API = 'http://localhost:8000';

async function init() {
  // Load settings
  const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API });
  document.getElementById('api-url').value = apiUrl;

  // Load last added
  const { lastAdded } = await chrome.storage.local.get('lastAdded');
  if (lastAdded) {
    const container = document.getElementById('last-added');
    const timeAgo = getTimeAgo(lastAdded.timestamp);

    container.innerHTML = `
      <div class="last-added">
        <div class="last-added-label">
          Último añadido ${timeAgo}
          <span class="${lastAdded.success ? 'success' : 'error'}">
            ${lastAdded.success ? '✓' : '✗'}
          </span>
        </div>
        <div class="last-added-text">"${lastAdded.text}"</div>
        ${lastAdded.error ? `<div class="error" style="margin-top: 6px; font-size: 11px;">Error: ${lastAdded.error}</div>` : ''}
      </div>
    `;
  }

  // Load stats
  await loadStats(apiUrl);

  // Save settings handler
  document.getElementById('save-settings').addEventListener('click', async () => {
    const newUrl = document.getElementById('api-url').value.trim();
    await chrome.storage.sync.set({ apiUrl: newUrl || DEFAULT_API });

    // Update background script
    chrome.runtime.sendMessage({ type: 'updateApiUrl', url: newUrl || DEFAULT_API });

    // Reload stats with new URL
    await loadStats(newUrl || DEFAULT_API);
  });
}

async function loadStats(apiUrl) {
  const statsContainer = document.getElementById('stats');

  try {
    const response = await fetch(`${apiUrl}/api/reservoir/stats`);
    if (response.ok) {
      const stats = await response.json();
      statsContainer.innerHTML = `
        <div class="stats-row">
          <span>Ideas en el reservorio:</span>
          <span>${stats.total_items}</span>
        </div>
        <div class="stats-row">
          <span>Añadidas hoy:</span>
          <span>${stats.added_today}</span>
        </div>
      `;
    } else {
      statsContainer.innerHTML = '<div class="error">No se pudo conectar con la API</div>';
    }
  } catch {
    statsContainer.innerHTML = '<div class="error">API no disponible</div>';
  }
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'hace un momento';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

init();
