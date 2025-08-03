const express = require('express');
const cors = require('cors');
const { customAlphabet } = require('nanoid');
const { clerkMiddleware, getAuth } = require('@clerk/express');
require('dotenv').config();
const {connectToDb , getDb} =require('./db_connect');
const app = express();

app.use(clerkMiddleware()); 
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


connectToDb()
    .then(() => {
        db = getDb();
        app.listen(process.env.SERVER_PORT, () => {
            console.log(`Server is listening at http://localhost:${process.env.SERVER_PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to DB:', err);
    });  


function short(req, res, next) {
    const char = '0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
    const short = customAlphabet(char, 8);
    req.shortUrl = short();
    next();
}

function checkprotocol(reqUrl){
    try{
        const url = new URL(reqUrl);
        if(url.protocol === 'http:' || url.protocol === 'https:'){
            return true;
        }else{
            throw new error('invalid url');
        }
    }catch(err){
        return false;
    }
}

function urlcheck(url) {
  if(url.includes(',' || url.includes(' '))) return false;
  if(!url.includes('.')) return false;
  return true
}


app.post('/api/shorten',short, async (req, res) => {
    const {userId} =getAuth(req);
    if(!userId) return res.status(401).json({message: 'please login' });
    if(!req.body.originalUrl) return res.status(400).json({ message: 'Please enter a url' });
    if(!checkprotocol(req.body.originalUrl)) return res.status(400).json({ message: 'Please enter a valid protocol' });
    if(!urlcheck(req.body.originalUrl)) return res.status(400).json({message:"please enter a valid url"});


    const original = req.body.originalUrl;
    const short = `http://localhost:3000/${req.shortUrl}`;
    
    const query = 'SELECT short_url, long_url FROM userdata where long_url = ? and user_id = ?';
    const result = await db.execute(query, [original,userId]);
                
    if(result[0].length>0){
                    return res.status(200).json({
                        "shorturl": result[0][0].short_url,
            "originalurl": result[0][0].long_url
        });
    }

    try{
            await insert(short, original, userId);
                res.status(302).json({
                        "shorturl": short,
                        "originalurl": original
                    });
        }catch(err){
                res.status(400).send('error occured while inserting the url into db');
            }
            
    });

async function insert(short, original ,user_id) {
    try{
        const query = 'INSERT INTO userdata (short_url, long_url , user_id) VALUES (?, ? ,?)';
        
        const [result] = await db.execute(query, [short, original,user_id]);
        
    }catch(err){
        
        console.log(err);
        throw err;
        
    }
    
}

app.put('/deletedata', async (req, res) => {
    const data = req.body.item.short;
    const {userId} =getAuth(req);
    try {
        const result = await db.query('DELETE FROM userdata WHERE short_url = ? and user_id = ?', [data,userId]);
        res.json({ data: result, message: 'Data deleted successfully' });
    } catch (err) {
        console.error('Error deleting data:', err);
        res.status(500).json({ message: 'Error deleting data' });
    }
});



app.get('/getdata',async (req,res)=>{
    const { userId} = getAuth(req);
    if(!userId) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const query = 'SELECT * FROM userdata where user_id = ?';
        const [result] = await db.execute(query,[userId]);
        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        res.json({ data: result, message: 'successful' });
    } catch (err) {
        console.error('Error in /getdata:', err);
        res.status(500).json({ error: 'Database error' });
    }
})


app.get('/:code',async (req, res) => {
    const{userId} = getAuth(req);
    const code =`http://localhost:3000/${req.params.code}`;
    
    if (!code) return res.status(404).send('no url found');
    
    const query ='SELECT long_url from userdata where short_url = ? and user_id = ?';
    const [result] =await db.execute(query,[code,userId]);
    return res.redirect(result[0].long_url);
})