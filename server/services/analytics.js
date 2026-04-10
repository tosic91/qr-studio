const db = require('../db/connection');

class AnalyticsService {
  /**
   * Log a scan event
   */
  async logScan(qrCodeId, data) {
    await db('scan_logs').insert({
      qr_code_id: qrCodeId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      device_type: data.deviceType,
      country: data.country || null,
      city: data.city || null,
      referer: data.referer || null,
    });
  }

  /**
   * Get analytics for a single QR code
   */
  async getForQR(qrCodeId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Total scans
    const [{ count: totalScans }] = await db('scan_logs')
      .where({ qr_code_id: qrCodeId })
      .count('id as count');

    // Scans in period
    const [{ count: periodScans }] = await db('scan_logs')
      .where({ qr_code_id: qrCodeId })
      .where('scanned_at', '>=', since)
      .count('id as count');

    // Scans by day
    const scansByDay = await db('scan_logs')
      .select(db.raw("DATE(scanned_at) as date"))
      .count('id as count')
      .where({ qr_code_id: qrCodeId })
      .where('scanned_at', '>=', since)
      .groupByRaw('DATE(scanned_at)')
      .orderBy('date', 'asc');

    // Scans by device
    const scansByDevice = await db('scan_logs')
      .select('device_type')
      .count('id as count')
      .where({ qr_code_id: qrCodeId })
      .groupBy('device_type');

    // Scans by country
    const scansByCountry = await db('scan_logs')
      .select('country')
      .count('id as count')
      .where({ qr_code_id: qrCodeId })
      .whereNotNull('country')
      .groupBy('country')
      .orderBy('count', 'desc')
      .limit(10);

    // Recent scans
    const recentScans = await db('scan_logs')
      .where({ qr_code_id: qrCodeId })
      .orderBy('scanned_at', 'desc')
      .limit(20);

    return {
      totalScans: parseInt(totalScans),
      periodScans: parseInt(periodScans),
      period: days,
      scansByDay: scansByDay.map(r => ({ date: r.date, count: parseInt(r.count) })),
      scansByDevice: scansByDevice.map(r => ({ device: r.device_type || 'unknown', count: parseInt(r.count) })),
      scansByCountry: scansByCountry.map(r => ({ country: r.country, count: parseInt(r.count) })),
      recentScans: recentScans.map(s => ({
        scannedAt: s.scanned_at,
        deviceType: s.device_type,
        country: s.country,
        city: s.city,
      })),
    };
  }

  /**
   * Get overview analytics for a user
   */
  async getOverview(userId) {
    // Total QR codes
    const [{ count: totalQR }] = await db('qr_codes')
      .where({ user_id: userId })
      .count('id as count');

    // Total scans across all QR codes
    const [{ count: totalScans }] = await db('scan_logs')
      .join('qr_codes', 'scan_logs.qr_code_id', 'qr_codes.id')
      .where('qr_codes.user_id', userId)
      .count('scan_logs.id as count');

    // Dynamic vs Static count
    const typeBreakdown = await db('qr_codes')
      .select('type')
      .count('id as count')
      .where({ user_id: userId })
      .groupBy('type');

    // Top performing QR codes
    const topQRs = await db('qr_codes')
      .where({ user_id: userId })
      .orderBy('scan_count', 'desc')
      .limit(5);

    return {
      totalQR: parseInt(totalQR),
      totalScans: parseInt(totalScans),
      typeBreakdown: typeBreakdown.map(r => ({ type: r.type, count: parseInt(r.count) })),
      topQRs: topQRs.map(qr => ({
        id: qr.id,
        title: qr.title,
        type: qr.type,
        scanCount: qr.scan_count,
      })),
    };
  }
}

module.exports = new AnalyticsService();
