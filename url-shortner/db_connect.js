const mysql = require('mysql2/promise');

let pool;


async function connectToDb() {
  pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Vu22csen0100557',
    database: 'urldata',
    waitForConnections: true,
    connectionLimit: 10,  // Limit concurrent connections
    queueLimit: 0
  });
}

function getDb() {
  return pool;
}

module.exports = { connectToDb, getDb };
