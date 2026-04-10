/**
 * Dashboard Logic
 */

let allQRCodes = [];
let editingQRId = null;

// ── Initialize Dashboard ──
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) {
    window.location.href = '/login';
    return;
  }
  updateNavForAuth(user);
  loadDashboard();
});

async function loadDashboard() {
  try {
    // Load stats and QR codes in parallel
    const [overviewData, qrData] = await Promise.all([
      API.overview(),
      API.listQR(),
    ]);

    // Render stats
    document.getElementById('stat-total').textContent = overviewData.totalQR || 0;
    const dynamicCount = overviewData.typeBreakdown?.find(t => t.type === 'dynamic')?.count || 0;
    document.getElementById('stat-dynamic').textContent = dynamicCount;
    document.getElementById('stat-scans').textContent = overviewData.totalScans || 0;

    // Render QR list
    allQRCodes = qrData.qrCodes || [];
    renderQRList(allQRCodes);
  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Failed to load dashboard', 'error');
  }
}

// ── Render QR List ──
function renderQRList(qrCodes) {
  const container = document.getElementById('qr-list');
  
  if (!qrCodes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📱</div>
        <h3>No QR codes yet</h3>
        <p>Create your first QR code to get started</p>
        <a href="/#generator" class="btn btn-primary mt-lg">Create QR Code</a>
      </div>
    `;
    return;
  }

  container.innerHTML = qrCodes.map(qr => {
    const typeLabel = qr.type === 'dynamic' ? 'Dynamic' : 'Static';
    const typeBadge = qr.type === 'dynamic' ? 'badge-dynamic' : 'badge-static';
    const activeBadge = qr.isActive ? 'badge-active' : 'badge-inactive';
    const activeLabel = qr.isActive ? 'Active' : 'Inactive';
    const dateStr = new Date(qr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const redirectUrl = qr.shortCode ? `${window.location.origin}/r/${qr.shortCode}` : '';

    return `
      <div class="qr-item fade-in-up" data-id="${qr.id}">
        <div class="qr-item-thumb" id="thumb-${qr.id}"></div>
        <div class="qr-item-info">
          <div class="qr-item-title">${escapeHtml(qr.title || 'Untitled')}</div>
          <div class="qr-item-meta">
            <span class="badge ${typeBadge}">${typeLabel}</span>
            <span class="badge ${activeBadge}">${activeLabel}</span>
            <span>📊 ${qr.scanCount || 0} scans</span>
            <span>📅 ${dateStr}</span>
          </div>
          ${redirectUrl ? `<div class="qr-item-meta mt-sm" style="font-size: 11px;"><span style="color: var(--accent-primary); user-select: all;">🔗 ${redirectUrl}</span></div>` : ''}
        </div>
        <div class="qr-item-actions">
          ${qr.type === 'dynamic' ? `
            <button class="btn btn-secondary btn-sm" onclick="openEditModal(${qr.id})" title="Edit">✏️ Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="openAnalytics(${qr.id})" title="Analytics">📊</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleQR(${qr.id})" title="Toggle active">
              ${qr.isActive ? '⏸️' : '▶️'}
            </button>
          ` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteQR(${qr.id})" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // Render QR thumbnails
  qrCodes.forEach(qr => {
    renderThumbnail(qr);
  });
}

// ── Render QR Thumbnail ──
function renderThumbnail(qr) {
  const container = document.getElementById(`thumb-${qr.id}`);
  if (!container) return;

  const style = qr.styleConfig || {};
  let qrString;
  
  if (qr.type === 'dynamic' && qr.shortCode) {
    qrString = `${window.location.origin}/r/${qr.shortCode}`;
  } else {
    qrString = buildQRStringFromContent(qr.contentType, qr.content);
  }

  try {
    const qrCode = new QRCodeStyling({
      width: 56,
      height: 56,
      data: qrString || 'https://example.com',
      dotsOptions: {
        color: style.fgColor || '#1e1e2e',
        type: style.dotType || 'rounded',
      },
      cornersSquareOptions: {
        type: style.cornerType || 'extra-rounded',
        color: style.fgColor || '#1e1e2e',
      },
      backgroundOptions: {
        color: style.bgColor || '#ffffff',
      },
      qrOptions: { errorCorrectionLevel: 'L' },
    });
    qrCode.append(container);
  } catch (e) {
    container.textContent = '📱';
  }
}

// ── Build QR string from saved data ──
function buildQRStringFromContent(type, content) {
  if (!content) return 'https://example.com';
  switch (type) {
    case 'url': return content.url || '';
    case 'text': return content.text || '';
    case 'wifi': return `WIFI:T:${content.encryption || 'WPA'};S:${content.ssid || ''};P:${content.password || ''};;`;
    case 'vcard': return [
      'BEGIN:VCARD', 'VERSION:3.0',
      `N:${content.lastName || ''};${content.firstName || ''}`,
      `FN:${content.firstName || ''} ${content.lastName || ''}`,
      content.phone ? `TEL:${content.phone}` : '',
      content.email ? `EMAIL:${content.email}` : '',
      content.org ? `ORG:${content.org}` : '',
      content.url ? `URL:${content.url}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');
    case 'email': return `mailto:${content.address || ''}?subject=${encodeURIComponent(content.subject || '')}&body=${encodeURIComponent(content.body || '')}`;
    case 'phone': return `tel:${content.phone || ''}`;
    case 'sms': return `sms:${content.phone || ''}${content.message ? `?body=${encodeURIComponent(content.message)}` : ''}`;
    default: return '';
  }
}

// ── Toggle QR Active ──
async function toggleQR(id) {
  try {
    await API.toggleQR(id);
    showToast('QR code status updated', 'success');
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Delete QR ──
async function deleteQR(id) {
  if (!confirm('Are you sure you want to delete this QR code? This cannot be undone.')) return;
  try {
    await API.deleteQR(id);
    showToast('QR code deleted', 'success');
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Edit Modal ──
function openEditModal(id) {
  const qr = allQRCodes.find(q => q.id === id);
  if (!qr) return;
  
  editingQRId = id;
  const modal = document.getElementById('edit-modal');
  const formContent = document.getElementById('edit-form-content');
  
  // Build edit form based on content type
  let formHtml = `
    <div class="form-group">
      <label class="form-label">Title</label>
      <input type="text" class="form-control" id="edit-title" value="${escapeHtml(qr.title || '')}">
    </div>
  `;

  if (qr.contentType === 'url') {
    formHtml += `
      <div class="form-group">
        <label class="form-label">Destination URL</label>
        <input type="url" class="form-control" id="edit-url" value="${escapeHtml(qr.content.url || '')}" placeholder="https://example.com">
        <p class="form-hint">Change this URL and anyone who scans the QR code will be redirected to the new destination</p>
      </div>
    `;
  } else if (qr.contentType === 'text') {
    formHtml += `
      <div class="form-group">
        <label class="form-label">Text Content</label>
        <textarea class="form-control" id="edit-text" rows="4">${escapeHtml(qr.content.text || '')}</textarea>
      </div>
    `;
  } else if (qr.contentType === 'wifi') {
    formHtml += `
      <div class="form-group">
        <label class="form-label">SSID</label>
        <input type="text" class="form-control" id="edit-ssid" value="${escapeHtml(qr.content.ssid || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="text" class="form-control" id="edit-wifi-password" value="${escapeHtml(qr.content.password || '')}">
      </div>
    `;
  } else {
    // Generic JSON editor for other types
    formHtml += `
      <div class="form-group">
        <label class="form-label">Content (JSON)</label>
        <textarea class="form-control" id="edit-content-json" rows="6">${JSON.stringify(qr.content, null, 2)}</textarea>
      </div>
    `;
  }

  if (qr.shortCode) {
    formHtml += `
      <div class="form-group">
        <label class="form-label">Redirect URL</label>
        <input type="text" class="form-control" value="${window.location.origin}/r/${qr.shortCode}" readonly style="opacity: 0.7;">
        <p class="form-hint">This is the URL encoded in the QR code image</p>
      </div>
    `;
  }

  formContent.innerHTML = formHtml;
  modal.classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingQRId = null;
}

async function saveEdit() {
  if (!editingQRId) return;
  const qr = allQRCodes.find(q => q.id === editingQRId);
  if (!qr) return;

  const btn = document.getElementById('edit-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner spinner-sm"></span> Saving...';

  try {
    const title = document.getElementById('edit-title')?.value;
    let content;

    if (qr.contentType === 'url') {
      content = { url: document.getElementById('edit-url')?.value || '' };
    } else if (qr.contentType === 'text') {
      content = { text: document.getElementById('edit-text')?.value || '' };
    } else if (qr.contentType === 'wifi') {
      content = {
        ssid: document.getElementById('edit-ssid')?.value || '',
        password: document.getElementById('edit-wifi-password')?.value || '',
        encryption: qr.content.encryption || 'WPA',
      };
    } else {
      const jsonStr = document.getElementById('edit-content-json')?.value;
      content = JSON.parse(jsonStr);
    }

    await API.updateQR(editingQRId, { title, content });
    showToast('QR code updated!', 'success');
    closeEditModal();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

// ── Analytics Modal ──
async function openAnalytics(id) {
  const qr = allQRCodes.find(q => q.id === id);
  if (!qr) return;

  const modal = document.getElementById('analytics-modal');
  const title = document.getElementById('analytics-title');
  const content = document.getElementById('analytics-content');
  
  title.textContent = `Analytics — ${qr.title || 'QR Code'}`;
  content.innerHTML = '<div class="text-center"><div class="spinner" style="margin: 0 auto;"></div><p class="mt-md">Loading analytics...</p></div>';
  modal.classList.remove('hidden');

  try {
    const data = await API.qrAnalytics(id, 30);
    
    // Build analytics view
    let html = `
      <div class="stats-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-card">
          <div class="stat-value">${data.totalScans}</div>
          <div class="stat-label">Total Scans</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.periodScans}</div>
          <div class="stat-label">Last ${data.period} Days</div>
        </div>
      </div>
    `;

    // Chart (simple bar chart)
    if (data.scansByDay && data.scansByDay.length > 0) {
      const maxCount = Math.max(...data.scansByDay.map(d => d.count), 1);
      html += `
        <div class="card-header"><h3 class="card-title" style="font-size: var(--font-md);">Scans by Day</h3></div>
        <div class="chart-container" style="margin-bottom: 1.5rem;">
          ${data.scansByDay.map(d => {
            const height = Math.max((d.count / maxCount) * 100, 4);
            return `<div class="chart-bar" style="height: ${height}%;" title="${d.date}: ${d.count} scans"></div>`;
          }).join('')}
        </div>
      `;
    }

    // Device breakdown
    if (data.scansByDevice && data.scansByDevice.length > 0) {
      html += `
        <div class="card-header"><h3 class="card-title" style="font-size: var(--font-md);">Devices</h3></div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          ${data.scansByDevice.map(d => {
            const icons = { mobile: '📱', desktop: '💻', tablet: '📱', unknown: '❓' };
            return `<span class="badge badge-dynamic" style="padding: 6px 12px; font-size: 13px;">${icons[d.device] || '❓'} ${d.device}: ${d.count}</span>`;
          }).join('')}
        </div>
      `;
    }

    // Recent scans
    if (data.recentScans && data.recentScans.length > 0) {
      html += `
        <div class="card-header"><h3 class="card-title" style="font-size: var(--font-md);">Recent Scans</h3></div>
        <div style="max-height: 200px; overflow-y: auto;">
          ${data.recentScans.slice(0, 10).map(s => {
            const time = new Date(s.scannedAt).toLocaleString();
            return `<div style="padding: 8px 0; border-bottom: 1px solid var(--border-glass); font-size: 13px; color: var(--text-secondary);">
              <span>${time}</span> · <span>${s.deviceType || 'unknown'}</span>${s.country ? ` · <span>${s.country}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      `;
    }

    if (data.totalScans === 0) {
      html += `
        <div class="empty-state" style="padding: 2rem 0;">
          <div class="icon">📊</div>
          <p>No scans yet. Share your QR code to start tracking!</p>
        </div>
      `;
    }

    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Failed to load analytics: ${err.message}</p></div>`;
  }
}

function closeAnalyticsModal() {
  document.getElementById('analytics-modal').classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeEditModal();
    closeAnalyticsModal();
  }
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditModal();
    closeAnalyticsModal();
  }
});

// ── Utility ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
