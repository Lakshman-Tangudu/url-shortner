const express = require('express');
const cors = require('cors');
const { customAlphabet } = require('nanoid');
const { clerkMiddleware, getAuth } = require('@clerk/express');
require('dotenv').config();
const { connectToDb, getDb } = require('./db_connect');

const app = express();
let db;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.options('*', cors());

app.use(clerkMiddleware());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

(async () => {
  try {
    await connectToDb();
    db = getDb();
    app.listen(process.env.SERVER_PORT || 3001, () => {
      console.log('Server is running...');
    });
  } catch (err) {
    console.error('Failed to connect to DB:', err);
  }
})();

function short(req, res, next) {
  const char = '0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
  const short = customAlphabet(char, 8);
  req.shortUrl = short();
  next();
}

function checkprotocol(reqUrl) {
  try {
    const url = new URL(reqUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function urlcheck(url) {
  if (url.includes(',') || url.includes(' ')) return false;
  if (!url.includes('.')) return false;
  return true;
}

app.post('/api/shorten', short, async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: 'Please login' });
  if (!req.body.originalUrl) return res.status(400).json({ message: 'Please enter a url' });
  if (!checkprotocol(req.body.originalUrl)) return res.status(400).json({ message: 'Please enter a valid protocol' });
  if (!urlcheck(req.body.originalUrl)) return res.status(400).json({ message: 'Please enter a valid url' });

  const original = req.body.originalUrl;
  const short = `https://${req.get('host')}/${req.shortUrl}`;

  const query = 'SELECT short_url, long_url FROM userdata WHERE long_url = $1 AND user_id = $2';
  const result = await db.query(query, [original, userId]);

  if (result.rows.length > 0) {
    return res.status(200).json({
      shorturl: result.rows[0].short_url,
      originalurl: result.rows[0].long_url
    });
  }

  try {
    await insert(short, original, userId);
    res.status(201).json({
      shorturl: short,
      originalurl: original
    });
  } catch (err) {
    res.status(400).send('Error occurred while inserting the url into db');
  }
});

async function insert(short, original, user_id) {
  try {
    const query = 'INSERT INTO userdata (short_url, long_url, user_id) VALUES ($1, $2, $3)';
    await db.query(query, [short, original, user_id]);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

app.put('/deletedata', async (req, res) => {
  const data = req.body.item.short;
  const { userId } = getAuth(req);

  if (!data) return res.status(400).json({ message: 'Short URL not provided.' });

  try {
    const result = await db.query('DELETE FROM userdata WHERE short_url = $1 AND user_id = $2', [data, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No matching data found to delete.' });
    }
    res.json({ message: 'Data deleted successfully' });
  } catch (err) {
    console.error('Error deleting data:', err);
    res.status(500).json({ message: 'Error deleting data' });
  }
});

app.get('/getdata', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const query = 'SELECT * FROM userdata WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    res.json({ data: result.rows, message: 'Successful' });
  } catch (err) {
    console.error('Error in /getdata:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/:code', async (req, res) => {
  const { userId } = getAuth(req);
  const code = `https://${req.get('host')}/${req.params.code}`;

  if (!code) return res.status(404).send('no url found');

  const query = 'SELECT long_url FROM userdata WHERE short_url = $1 AND user_id = $2';
  const result = await db.query(query, [code, userId]);

  if (result.rows.length === 0) {
    return res.status(404).send('URL not found');
  }

  return res.redirect(result.rows[0].long_url);
});
