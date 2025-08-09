const express = require('express');
const { customAlphabet } = require('nanoid');
const { clerkMiddleware, getAuth } = require('@clerk/express');
require('dotenv').config();
const { connectToDb, getDb } = require('./db_connect');

const app = express();
let db;

// --- START: MANUAL CORS HEADERS MIDDLEWARE ---
// This middleware manually sets the required CORS headers on every response.
app.use((req, res, next) => {
  // Set the Access-Control-Allow-Origin header to allow requests from your specific frontend URL.
  res.setHeader('Access-Control-Allow-Origin', 'https://url-shortner-bay-kappa.vercel.app');
  
  // Allow specific HTTP methods.
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow specific headers. It's crucial to include 'Authorization' for Clerk to work.
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Allow cookies and authorization headers to be sent from the frontend.
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // The browser sends an OPTIONS request first (a "preflight" request) to check these permissions.
  // If the method is OPTIONS, we send back a 204 "No Content" response to tell the browser it's okay.
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  // If it's not a preflight request, move on to the next middleware or route handler.
  next();
});
// --- END: MANUAL CORS HEADERS MIDDLEWARE ---


// Clerk middleware should come after CORS but before your routes.
app.use(clerkMiddleware());

// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// --- Database Connection and Server Start ---
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


// --- Helper Functions ---

// Middleware to generate a short URL slug
function short(req, res, next) {
  const char = '0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
  const short = customAlphabet(char, 8);
  req.shortUrl = short();
  next();
}

// Function to check if a URL has a valid protocol (http or https)
function checkprotocol(reqUrl) {
  try {
    const url = new URL(reqUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Basic check for a valid-looking URL structure
function urlcheck(url) {
  if (url.includes(',') || url.includes(' ')) return false;
  if (!url.includes('.')) return false;
  return true;
}

// Function to insert a new URL record into the database
async function insert(short, original, user_id) {
  try {
    const query = 'INSERT INTO userdata (short_url, long_url, user_id) VALUES ($1, $2, $3)';
    await db.query(query, [short, original, user_id]);
  } catch (err) {
    console.log(err);
    throw err; // Re-throw the error to be caught by the route handler
  }
}


// --- API ROUTES ---

// POST /api/shorten - Create a new shortened URL
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
    res.status(500).send('Error occurred while inserting the url into db');
  }
});

// PUT /deletedata - Delete a shortened URL
app.put('/deletedata', async (req, res) => {
  const data = req.body.item.short;
  const { userId } = getAuth(req);

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
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

// GET /getdata - Retrieve all URLs for the logged-in user
app.get('/getdata', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const query = 'SELECT * FROM userdata WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    // It's better to return an empty array than a 404 if the user just doesn't have data yet.
    res.json({ data: result.rows, message: 'Successful' });
  } catch (err) {
    console.error('Error in /getdata:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /:code - Redirect to the original URL
app.get('/:code', async (req, res) => {
  // Note: This route is public and doesn't check for a userId, which is typical for a URL shortener.
  // Anyone with the short link should be able to use it.
  const code = `https://${req.get('host')}/${req.params.code}`;

  if (!code) return res.status(404).send('no url found');

  // The query should not be tied to a user_id for public redirection.
  const query = 'SELECT long_url FROM userdata WHERE short_url = $1';
  const result = await db.query(query, [code]);

  if (result.rows.length === 0) {
    return res.status(404).send('URL not found');
  }

  return res.redirect(result.rows[0].long_url);
});
