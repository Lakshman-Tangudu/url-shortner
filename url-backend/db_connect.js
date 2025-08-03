const { Pool } = require('pg');
require('dotenv').config();

let pool;

async function connectToDb() {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
  }
}

function getDb() {
  if (!pool) {
    throw new Error('Database not connected. Call connectToDb first.');
  }
  return pool;
}

module.exports = { connectToDb, getDb };