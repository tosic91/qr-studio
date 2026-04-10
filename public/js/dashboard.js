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

// ── SVG Icon Helpers ──
const SVG_ICONS = {
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  text: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  wifi: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>',
  user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  mail: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  phone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  message: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>',
  chart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  qr: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/></svg>',
};

// ── Get human-readable content summary ──
function getContentSummary(qr) {
  const content = qr.content || {};
  switch (qr.contentType) {
    case 'url':
      return { icon: SVG_ICONS.link, text: content.url || 'No URL', isLink: true, url: content.url };
    case 'text':
      return { icon: SVG_ICONS.text, text: content.text || 'No text', isLink: false };
    case 'wifi':
      return { icon: SVG_ICONS.wifi, text: `WiFi: ${content.ssid || 'Unknown'}`, isLink: false };
    case 'vcard':
      return { icon: SVG_ICONS.user, text: `${content.firstName || ''} ${content.lastName || ''}`.trim() || 'vCard', isLink: false };
    case 'email':
      return { icon: SVG_ICONS.mail, text: content.address || 'No email', isLink: false };
    case 'phone':
      return { icon: SVG_ICONS.phone, text: content.phone || 'No phone', isLink: false };
    case 'sms':
      return { icon: SVG_ICONS.message, text: content.phone || 'No phone', isLink: false };
    default:
      return { icon: SVG_ICONS.file, text: JSON.stringify(content).slice(0, 60), isLink: false };
  }
}

// ── Render QR List ──
function renderQRList(qrCodes) {
  const container = document.getElementById('qr-list');
  
  if (!qrCodes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg></div>
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
    
    // Get actual content summary instead of redirect URL
    const summary = getContentSummary(qr);
    const contentDisplay = summary.isLink
      ? `<a href="${escapeHtml(summary.url)}" target="_blank" rel="noopener noreferrer" class="qr-content-link" title="Open in new tab">${summary.icon} ${escapeHtml(truncateUrl(summary.text, 50))}</a>`
      : `<span class="qr-content-text">${summary.icon} ${escapeHtml(summary.text.length > 60 ? summary.text.slice(0, 60) + '…' : summary.text)}</span>`;

    return `
      <div class="qr-item fade-in-up" data-id="${qr.id}">
        <div class="qr-item-thumb" id="thumb-${qr.id}" onclick="openPreviewModal(${qr.id})" title="Click to preview full size"></div>
        <div class="qr-item-info">
          <div class="qr-item-title">${escapeHtml(qr.title || 'Untitled')}</div>
          <div class="qr-item-meta">
            <span class="badge ${typeBadge}">${typeLabel}</span>
            <span class="badge ${activeBadge}">${activeLabel}</span>
            <span>${SVG_ICONS.chart} ${qr.scanCount || 0} scans</span>
            <span>${SVG_ICONS.calendar} ${dateStr}</span>
          </div>
          <div class="qr-item-content mt-sm">${contentDisplay}</div>
        </div>
        <div class="qr-item-actions">
          ${qr.type === 'dynamic' ? `
            <button class="btn btn-secondary btn-sm" onclick="openEditModal(${qr.id})" title="Edit">${SVG_ICONS.edit} Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="openAnalytics(${qr.id})" title="Analytics">${SVG_ICONS.chart}</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleQR(${qr.id})" title="Toggle active">
              ${qr.isActive ? SVG_ICONS.pause : SVG_ICONS.play}
            </button>
          ` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteQR(${qr.id})" title="Delete">${SVG_ICONS.trash}</button>
        </div>
      </div>
    `;
  }).join('');

  // Render QR thumbnails
  qrCodes.forEach(qr => {
    renderThumbnail(qr);
  });
}

// ── Truncate URL for display ──
function truncateUrl(url, max) {
  if (!url || url.length <= max) return url;
  // Remove protocol for display
  const clean = url.replace(/^https?:\/\//, '');
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + '…';
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
    container.innerHTML = SVG_ICONS.qr;
  }
}

// ── QR Preview Modal ──
function openPreviewModal(id) {
  const qr = allQRCodes.find(q => q.id === id);
  if (!qr) return;

  const modal = document.getElementById('preview-modal');
  const previewContainer = document.getElementById('preview-qr-container');
  const previewTitle = document.getElementById('preview-title');
  const previewMeta = document.getElementById('preview-meta');
  
  previewTitle.textContent = qr.title || 'Untitled QR Code';
  
  // Build meta info
  const summary = getContentSummary(qr);
  const redirectUrl = qr.shortCode ? `${window.location.origin}/r/${qr.shortCode}` : '';
  
  let metaHtml = `
    <div class="preview-info-row">
      <span class="preview-label">Type</span>
      <span class="badge ${qr.type === 'dynamic' ? 'badge-dynamic' : 'badge-static'}">${qr.type === 'dynamic' ? 'Dynamic' : 'Static'}</span>
    </div>
    <div class="preview-info-row">
      <span class="preview-label">Content</span>
      <span class="preview-value">${summary.icon} ${escapeHtml(summary.text)}</span>
    </div>
  `;
  
  if (summary.isLink && summary.url) {
    metaHtml += `
      <div class="preview-info-row">
        <span class="preview-label">Destination</span>
        <a href="${escapeHtml(summary.url)}" target="_blank" rel="noopener noreferrer" class="preview-link">${escapeHtml(summary.url)} ↗</a>
      </div>
    `;
  }
  
  if (redirectUrl) {
    metaHtml += `
      <div class="preview-info-row">
        <span class="preview-label">Redirect URL</span>
        <span class="preview-value preview-redirect-url" title="Click to copy" onclick="copyToClipboard('${redirectUrl}')">${redirectUrl} ${SVG_ICONS.copy}</span>
      </div>
    `;
  }
  
  metaHtml += `
    <div class="preview-info-row">
      <span class="preview-label">Scans</span>
      <span class="preview-value">${SVG_ICONS.chart} ${qr.scanCount || 0}</span>
    </div>
    <div class="preview-info-row">
      <span class="preview-label">Created</span>
      <span class="preview-value">${new Date(qr.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
    </div>
  `;
  
  previewMeta.innerHTML = metaHtml;
  
  // Render large QR code
  previewContainer.innerHTML = '';
  const style = qr.styleConfig || {};
  let qrString;
  
  if (qr.type === 'dynamic' && qr.shortCode) {
    qrString = `${window.location.origin}/r/${qr.shortCode}`;
  } else {
    qrString = buildQRStringFromContent(qr.contentType, qr.content);
  }

  try {
    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
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
      qrOptions: { errorCorrectionLevel: 'M' },
      imageOptions: { crossOrigin: 'anonymous', margin: 10 },
    });
    
    // Store reference for download
    window._previewQR = qrCode;
    qrCode.append(previewContainer);
  } catch (e) {
    previewContainer.innerHTML = '<p style="color: var(--text-muted);">Failed to render QR code</p>';
  }

  modal.classList.remove('hidden');
}

function closePreviewModal() {
  document.getElementById('preview-modal').classList.add('hidden');
  window._previewQR = null;
}

async function downloadPreviewQR(format) {
  if (!window._previewQR) return;
  try {
    await window._previewQR.download({ name: 'qr-code', extension: format });
    showToast(`Downloaded as ${format.toUpperCase()}`, 'success');
  } catch (e) {
    showToast('Download failed', 'error');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Copied to clipboard!', 'success');
  });
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
            const deviceIcons = {
              mobile: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
              desktop: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
              tablet: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
              unknown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
            };
            return `<span class="badge badge-dynamic" style="padding: 6px 12px; font-size: 13px;">${deviceIcons[d.device] || deviceIcons.unknown} ${d.device}: ${d.count}</span>`;
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
           <div class="icon">${SVG_ICONS.chart}</div>
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
    closePreviewModal();
  }
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditModal();
    closeAnalyticsModal();
    closePreviewModal();
  }
});

// ── Utility ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
