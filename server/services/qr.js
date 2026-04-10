const db = require('../db/connection');
const { generateShortCode } = require('./shortcode');

class QRService {
  /**
   * Create a new QR code
   */
  async create(userId, data) {
    const qrData = {
      user_id: userId,
      type: data.type, // 'static' or 'dynamic'
      content_type: data.contentType,
      content: JSON.stringify(data.content),
      title: data.title || `${data.contentType} QR`,
      style_config: JSON.stringify(data.styleConfig || {}),
    };

    // Generate short code for dynamic QR
    if (data.type === 'dynamic') {
      let shortCode;
      let exists = true;
      // Ensure uniqueness
      while (exists) {
        shortCode = generateShortCode();
        const existing = await db('qr_codes').where({ short_code: shortCode }).first();
        exists = !!existing;
      }
      qrData.short_code = shortCode;
    }

    const [qr] = await db('qr_codes').insert(qrData).returning('*');
    return this._formatQR(qr);
  }

  /**
   * Get all QR codes for a user
   */
  async listByUser(userId) {
    const qrs = await db('qr_codes')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return qrs.map(qr => this._formatQR(qr));
  }

  /**
   * Get a single QR code by ID (with ownership check)
   */
  async getById(id, userId) {
    const qr = await db('qr_codes').where({ id, user_id: userId }).first();
    if (!qr) return null;
    return this._formatQR(qr);
  }

  /**
   * Get a QR code by short code (for redirect)
   */
  async getByShortCode(shortCode) {
    const qr = await db('qr_codes').where({ short_code: shortCode }).first();
    if (!qr) return null;
    return this._formatQR(qr);
  }

  /**
   * Update a QR code
   */
  async update(id, userId, data) {
    const updateData = {};
    if (data.content !== undefined) updateData.content = JSON.stringify(data.content);
    if (data.title !== undefined) updateData.title = data.title;
    if (data.styleConfig !== undefined) updateData.style_config = JSON.stringify(data.styleConfig);
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    updateData.updated_at = new Date();

    const [qr] = await db('qr_codes')
      .where({ id, user_id: userId })
      .update(updateData)
      .returning('*');
    
    if (!qr) return null;
    return this._formatQR(qr);
  }

  /**
   * Toggle active state
   */
  async toggleActive(id, userId) {
    const qr = await db('qr_codes').where({ id, user_id: userId }).first();
    if (!qr) return null;

    const [updated] = await db('qr_codes')
      .where({ id })
      .update({ is_active: !qr.is_active, updated_at: new Date() })
      .returning('*');
    
    return this._formatQR(updated);
  }

  /**
   * Delete a QR code
   */
  async delete(id, userId) {
    const count = await db('qr_codes').where({ id, user_id: userId }).del();
    return count > 0;
  }

  /**
   * Increment scan count
   */
  async incrementScanCount(id) {
    await db('qr_codes').where({ id }).increment('scan_count', 1);
  }

  /**
   * Format QR object for API response
   */
  _formatQR(qr) {
    return {
      id: qr.id,
      userId: qr.user_id,
      shortCode: qr.short_code,
      type: qr.type,
      contentType: qr.content_type,
      content: typeof qr.content === 'string' ? JSON.parse(qr.content) : qr.content,
      title: qr.title,
      styleConfig: typeof qr.style_config === 'string' ? JSON.parse(qr.style_config) : (qr.style_config || {}),
      isActive: qr.is_active,
      scanCount: qr.scan_count,
      createdAt: qr.created_at,
      updatedAt: qr.updated_at,
    };
  }
}

module.exports = new QRService();
