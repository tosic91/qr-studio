/**
 * QR Generator UI Logic
 * Uses qr-code-styling library for rich customization
 */

let qrCodeInstance = null;
let currentContentType = 'url';
let currentQRType = 'dynamic'; // default to dynamic

// ── Content Type Definitions ──
const CONTENT_TYPES = {
  url:   { icon: '🔗', label: 'URL',   fields: ['url'] },
  text:  { icon: '📝', label: 'Text',  fields: ['text'] },
  wifi:  { icon: '📶', label: 'WiFi',  fields: ['ssid', 'password', 'encryption'] },
  vcard: { icon: '👤', label: 'vCard', fields: ['firstName', 'lastName', 'phone', 'email', 'org', 'url'] },
  email: { icon: '✉️', label: 'Email', fields: ['address', 'subject', 'body'] },
  phone: { icon: '📞', label: 'Phone', fields: ['phone'] },
  sms:   { icon: '💬', label: 'SMS',   fields: ['phone', 'message'] },
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

// ── Get QR Content Data ──
function getQRContent() {
  switch (currentContentType) {
    case 'url':
      return { url: document.getElementById('qr-url')?.value || '' };
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
        <span class="icon">📱</span>
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
    container.innerHTML = `<div class="qr-preview-placeholder"><span class="icon">⚠️</span><p>Error generating QR code</p></div>`;
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
    
    // Show the short code for dynamic QR
    if (data.qrCode.type === 'dynamic' && data.qrCode.shortCode) {
      const redirectUrl = `${window.location.origin}/r/${data.qrCode.shortCode}`;
      showToast(`Dynamic URL: ${redirectUrl}`, 'info');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 Save QR Code';
    }
  }
}
