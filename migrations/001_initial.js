/**
 * Initial database schema for QR Code Generator
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', table => {
      table.increments('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('name', 255);
      table.timestamps(true, true);
    })
    .createTable('qr_codes', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('short_code', 20).unique();
      table.string('type', 20).notNullable(); // 'static' | 'dynamic'
      table.string('content_type', 20).notNullable(); // 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms'
      table.jsonb('content').notNullable();
      table.string('title', 255);
      table.jsonb('style_config').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.integer('scan_count').defaultTo(0);
      table.timestamps(true, true);
      
      table.index('short_code');
      table.index('user_id');
    })
    .createTable('scan_logs', table => {
      table.increments('id').primary();
      table.integer('qr_code_id').unsigned().references('id').inTable('qr_codes').onDelete('CASCADE');
      table.timestamp('scanned_at').defaultTo(knex.fn.now());
      table.string('ip_address', 45);
      table.text('user_agent');
      table.string('device_type', 20); // 'mobile' | 'desktop' | 'tablet'
      table.string('country', 100);
      table.string('city', 100);
      table.text('referer');

      table.index('qr_code_id');
      table.index('scanned_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('scan_logs')
    .dropTableIfExists('qr_codes')
    .dropTableIfExists('users');
};
