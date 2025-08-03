const mysql = require('mysql2/promise');
require('dotenv').config();
let pool;


async function connectToDb() {
  pool = mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    connectionLimit:process.env.DB_CONNECTION_LIMIT,
    waitForConnections:process.env.DB_WAIT_CONNECTION,
    queueLimit:process.env.DB_QUEUE_LIMIT
  });
}

function getDb() {
  return pool;
}

module.exports = { connectToDb, getDb };
