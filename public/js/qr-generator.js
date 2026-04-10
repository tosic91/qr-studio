/**
 * QR Generator UI Logic
 * Uses qr-code-styling library for rich customization
 */

let qrCodeInstance = null;
let currentContentType = 'url';
let currentQRType = 'dynamic'; // default to dynamic

// ── Content Type Definitions ──
const CONTENT_TYPES = {
  url:   { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', label: 'URL',   fields: ['url'] },
  text:  { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', label: 'Text',  fields: ['text'] },
  wifi:  { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>', label: 'WiFi',  fields: ['ssid', 'password', 'encryption'] },
  vcard: { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', label: 'vCard', fields: ['firstName', 'lastName', 'phone', 'email', 'org', 'url'] },
  email: { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>', label: 'Email', fields: ['address', 'subject', 'body'] },
  phone: { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', label: 'Phone', fields: ['phone'] },
  sms:   { icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', label: 'SMS',   fields: ['phone', 'message'] },
};

const DOT_TYPES = ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'];
const CORNER_TYPES = ['square', 'dot', 'extra-rounded'];

// ── Initialize Generator ──
function initGenerator() {
  renderContentTypes();
  renderStyleOptions();
  selectContentType('url');
  updateQRPreview();
  
  // QR Type toggle
  document.querySelectorAll('[data-qr-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-qr-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentQRType = btn.dataset.qrType;
    });
  });
}

// ── Render Content Type Selector ──
function renderContentTypes() {
  const container = document.getElementById('content-types');
  if (!container) return;

  container.innerHTML = Object.entries(CONTENT_TYPES).map(([key, ct]) => `
    <button class="content-type-btn" data-type="${key}" onclick="selectContentType('${key}')">
      <span class="icon">${ct.icon}</span>
      <span>${ct.label}</span>
    </button>
  `).join('');
}

// ── Select Content Type ──
function selectContentType(type) {
  currentContentType = type;
  
  // Update active button
  document.querySelectorAll('.content-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  
  // Render form fields
  renderContentForm(type);
}

// ── Render Content Form ──
function renderContentForm(type) {
  const container = document.getElementById('content-form');
  if (!container) return;

  const forms = {
    url: `
      <div class="form-group">
        <label class="form-label">URL</label>
        <input type="url" class="form-control" id="qr-url" placeholder="https://example.com" oninput="updateQRPreview()">
      </div>
    `,
    text: `
      <div class="form-group">
        <label class="form-label">Text Content</label>
        <textarea class="form-control" id="qr-text" placeholder="Enter your text here..." rows="4" oninput="updateQRPreview()"></textarea>
      </div>
    `,
    wifi: `
      <div class="form-group">
        <label class="form-label">Network Name (SSID)</label>
        <input type="text" class="form-control" id="qr-ssid" placeholder="My WiFi Network" oninput="updateQRPreview()">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="text" class="form-control" id="qr-wifi-password" placeholder="password123" oninput="updateQRPreview()">
        </div>
        <div class="form-group">
          <label class="form-label">Encryption</label>
          <select class="form-control" id="qr-encryption" onchange="updateQRPreview()">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="">None</option>
          </select>
        </div>
      </div>
    `,
    vcard: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input type="text" class="form-control" id="qr-firstname" placeholder="John" oninput="updateQRPreview()">
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input type="text" class="form-control" id="qr-lastname" placeholder="Doe" oninput="updateQRPreview()">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-control" id="qr-vcard-phone" placeholder="+84 123 456 789" oninput="updateQRPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" id="qr-vcard-email" placeholder="john@example.com" oninput="updateQRPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Organization</label>
        <input type="text" class="form-control" id="qr-org" placeholder="Company Name" oninput="updateQRPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Website</label>
        <input type="url" class="form-control" id="qr-vcard-url" placeholder="https://example.com" oninput="updateQRPreview()">
      </div>
    `,
    email: `
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-control" id="qr-email-address" placeholder="hello@example.com" oninput="updateQRPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Subject</label>
        <input type="text" class="form-control" id="qr-email-subject" placeholder="Hello!" oninput="updateQRPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Body</label>
        <textarea class="form-control" id="qr-email-body" placeholder="Message content..." rows="3" oninput="updateQRPreview()"></textarea>
      </div>
    `,
    phone: `
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="tel" class="form-control" id="qr-phone" placeholder="+84 123 456 789" oninput="updateQRPreview()">
      </div>
    `,
    sms: `
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="tel" class="form-control" id="qr-sms-phone" placeholder="+84 123 456 789" oninput="updateQRPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Message</label>
        <textarea class="form-control" id="qr-sms-message" placeholder="Pre-filled message..." rows="3" oninput="updateQRPreview()"></textarea>
      </div>
    `,
  };

  container.innerHTML = forms[type] || '';
}

// ── Normalize URL (auto-prepend https://) ──
function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (url && !/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

// ── Get QR Content Data ──
function getQRContent() {
  switch (currentContentType) {
    case 'url':
      return { url: normalizeUrl(document.getElementById('qr-url')?.value || '') };
    case 'text':
      return { text: document.getElementById('qr-text')?.value || '' };
    case 'wifi':
      return {
        ssid: document.getElementById('qr-ssid')?.value || '',
        password: document.getElementById('qr-wifi-password')?.value || '',
        encryption: document.getElementById('qr-encryption')?.value || 'WPA',
      };
    case 'vcard':
      return {
        firstName: document.getElementById('qr-firstname')?.value || '',
        lastName: document.getElementById('qr-lastname')?.value || '',
        phone: document.getElementById('qr-vcard-phone')?.value || '',
        email: document.getElementById('qr-vcard-email')?.value || '',
        org: document.getElementById('qr-org')?.value || '',
        url: document.getElementById('qr-vcard-url')?.value || '',
      };
    case 'email':
      return {
        address: document.getElementById('qr-email-address')?.value || '',
        subject: document.getElementById('qr-email-subject')?.value || '',
        body: document.getElementById('qr-email-body')?.value || '',
      };
    case 'phone':
      return { phone: document.getElementById('qr-phone')?.value || '' };
    case 'sms':
      return {
        phone: document.getElementById('qr-sms-phone')?.value || '',
        message: document.getElementById('qr-sms-message')?.value || '',
      };
    default:
      return {};
  }
}

// ── Build QR Data String ──
function buildQRString(type, content) {
  switch (type) {
    case 'url':
      return content.url || 'https://example.com';
    case 'text':
      return content.text || 'Hello World';
    case 'wifi':
      return `WIFI:T:${content.encryption || 'WPA'};S:${content.ssid || ''};P:${content.password || ''};;`;
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${content.lastName || ''};${content.firstName || ''}`,
        `FN:${content.firstName || ''} ${content.lastName || ''}`,
        content.phone ? `TEL:${content.phone}` : '',
        content.email ? `EMAIL:${content.email}` : '',
        content.org ? `ORG:${content.org}` : '',
        content.url ? `URL:${content.url}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    case 'email':
      return `mailto:${content.address || ''}?subject=${encodeURIComponent(content.subject || '')}&body=${encodeURIComponent(content.body || '')}`;
    case 'phone':
      return `tel:${content.phone || ''}`;
    case 'sms':
      return `sms:${content.phone || ''}${content.message ? `?body=${encodeURIComponent(content.message)}` : ''}`;
    default:
      return 'https://example.com';
  }
}

// ── Get Style Config ──
function getStyleConfig() {
  return {
    dotType: document.querySelector('.dot-option.active')?.dataset.value || 'rounded',
    cornerType: document.querySelector('.corner-option.active')?.dataset.value || 'extra-rounded',
    fgColor: document.getElementById('fg-color')?.value || '#1e1e2e',
    bgColor: document.getElementById('bg-color')?.value || '#ffffff',
  };
}

// ── Render Style Options ──
function renderStyleOptions() {
  // Dot styles
  const dotsContainer = document.getElementById('dot-styles');
  if (dotsContainer) {
    dotsContainer.innerHTML = DOT_TYPES.map(type => `
      <button class="style-option dot-option ${type === 'rounded' ? 'active' : ''}" data-value="${type}" onclick="selectDotType(this, '${type}')">
        ${type}
      </button>
    `).join('');
  }

  // Corner styles
  const cornersContainer = document.getElementById('corner-styles');
  if (cornersContainer) {
    cornersContainer.innerHTML = CORNER_TYPES.map(type => `
      <button class="style-option corner-option ${type === 'extra-rounded' ? 'active' : ''}" data-value="${type}" onclick="selectCornerType(this, '${type}')">
        ${type}
      </button>
    `).join('');
  }
}

function selectDotType(el, type) {
  document.querySelectorAll('.dot-option').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  updateQRPreview();
}

function selectCornerType(el, type) {
  document.querySelectorAll('.corner-option').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  updateQRPreview();
}

// ── Update QR Preview ──
function updateQRPreview() {
  const container = document.getElementById('qr-preview');
  if (!container) return;

  const content = getQRContent();
  const qrString = buildQRString(currentContentType, content);
  const style = getStyleConfig();

  // Clear previous
  container.innerHTML = '';

  if (!qrString || qrString === 'https://example.com') {
    container.innerHTML = `
      <div class="qr-preview-placeholder">
        <span class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg></span>
        <p>Enter content to generate<br>your QR code preview</p>
      </div>
    `;
    return;
  }

  // Get logo file if uploaded
  const logoInput = document.getElementById('qr-logo');
  let logoUrl = null;
  if (logoInput && logoInput.files && logoInput.files[0]) {
    logoUrl = URL.createObjectURL(logoInput.files[0]);
  }

  const opts = {
    width: 280,
    height: 280,
    data: qrString,
    dotsOptions: {
      color: style.fgColor,
      type: style.dotType,
    },
    cornersSquareOptions: {
      type: style.cornerType,
      color: style.fgColor,
    },
    cornersDotOptions: {
      type: style.cornerType === 'square' ? 'square' : 'dot',
      color: style.fgColor,
    },
    backgroundOptions: {
      color: style.bgColor,
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 8,
      imageSize: 0.35,
    },
    qrOptions: {
      errorCorrectionLevel: 'M',
    },
  };

  if (logoUrl) {
    opts.image = logoUrl;
    opts.qrOptions.errorCorrectionLevel = 'H'; // Higher error correction when using logo
  }

  try {
    qrCodeInstance = new QRCodeStyling(opts);
    qrCodeInstance.append(container);
  } catch (e) {
    console.error('QR generation error:', e);
    container.innerHTML = `<div class="qr-preview-placeholder"><span class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span><p>Error generating QR code</p></div>`;
  }
}

// ── Download QR ──
function downloadQR(format) {
  if (!qrCodeInstance) {
    showToast('Generate a QR code first', 'error');
    return;
  }
  qrCodeInstance.download({ name: 'qr-code', extension: format });
}

// ── Save QR to Server ──
async function saveQR() {
  const content = getQRContent();
  const style = getStyleConfig();
  const titleInput = document.getElementById('qr-title');
  const title = titleInput?.value || `${CONTENT_TYPES[currentContentType]?.label || 'QR'} Code`;

  // Validate
  const qrString = buildQRString(currentContentType, content);
  if (!qrString || qrString === 'https://example.com') {
    showToast('Please enter content for the QR code', 'error');
    return;
  }

  // Check auth
  const user = await checkAuth();
  if (!user) {
    showToast('Please login to save QR codes', 'error');
    setTimeout(() => window.location.href = '/login', 1000);
    return;
  }

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner spinner-sm"></span> Saving...';
  }

  try {
    const data = await API.createQR({
      type: currentQRType,
      contentType: currentContentType,
      content: content,
      title: title,
      styleConfig: style,
    });

    showToast('QR code saved successfully!', 'success');
    
    // For dynamic QR, re-render preview with the actual redirect URL
    // This ensures the QR the user downloads/scans is the SAME as on the dashboard
    if (data.qrCode.type === 'dynamic' && data.qrCode.shortCode) {
      const redirectUrl = `${window.location.origin}/r/${data.qrCode.shortCode}`;
      showToast(`Dynamic URL: ${redirectUrl}`, 'info');
      
      // Re-render QR with redirect URL so the preview matches the saved QR
      const container = document.getElementById('qr-preview');
      if (container) {
        container.innerHTML = '';
        const style = getStyleConfig();
        try {
          qrCodeInstance = new QRCodeStyling({
            width: 280,
            height: 280,
            data: redirectUrl,
            dotsOptions: { color: style.fgColor, type: style.dotType },
            cornersSquareOptions: { type: style.cornerType, color: style.fgColor },
            cornersDotOptions: { type: style.cornerType === 'square' ? 'square' : 'dot', color: style.fgColor },
            backgroundOptions: { color: style.bgColor },
            imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.35 },
            qrOptions: { errorCorrectionLevel: 'M' },
          });
          qrCodeInstance.append(container);
        } catch (e) {
          console.error('Re-render error:', e);
        }
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-3px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save QR Code';
    }
  }
}
