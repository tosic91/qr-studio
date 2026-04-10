const knex = require('knex');
const knexConfig = require('../../knexfile');
const config = require('../config');

const env = config.isProd ? 'production' : 'development';
const db = knex(knexConfig[env]);

module.exports = db;
