// Only load dotenv in development (Railway injects env vars directly)
try { require('dotenv').config(); } catch(e) {}

const connection = process.env.DATABASE_URL;

module.exports = {
  development: {
    client: 'pg',
    connection: connection,
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: connection,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};
