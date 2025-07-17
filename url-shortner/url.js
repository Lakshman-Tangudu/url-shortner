const express = require('express');
const cors = require('cors');
const { customAlphabet } = require('nanoid');
const { clerkMiddleware, getAuth } = require('@clerk/express'); // ✅ Correct
require('dotenv').config();
const {connectToDb , getDb} =require('./db_connect');
const axios = require('axios');

const app = express();

app.use(clerkMiddleware()); // ✅ Clerk must be registered FIRST!
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


connectToDb()
    .then(() => {
        db = getDb();
        app.listen(3000, () => {
            console.log('Server is listening at http://localhost:3000');
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

// async function checkurl(reqUrl) {
//     try {
//         console.log('Checking URL...');

//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

//         const response = await fetch(reqUrl, {
//             method: 'HEAD',
//             signal: controller.signal
//         });

//         clearTimeout(timeoutId);

//         console.log('Checked URL');
//         return response.ok;
        
//     } catch (err) {
//         console.error('Error checking URL:', err.message || err);
//         return false;
//     }
// }

async function checkLink(url) {
  try {
    const response = await axios.head(url);
    console.log(`${url} is working. Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`${url} failed. ${error.response?.status || error.message}`);
    return false;
  }
}


app.post('/api/shorten',short, async (req, res) => {
    const {userId} =getAuth(req);
    console.log(userId);
    if(!userId) return res.status(401).json({message: 'please login' });
    if(!req.body.originalUrl) return res.status(400).json({ message: 'Please enter a valid url' });
    if(!checkprotocol(req.body.originalUrl)) return res.status(400).json({ message: 'Please enter a valid url' });
    //if(!checkLink(req.body.originalUrl)) return res.status(400).json({ message: 'Please enter a valid url' });
    checkLink(req.body.originalUrl).then(async (r)=>{
        if(!r)  return res.status(400).json({ message: 'Please enter a valid url' });
    console.log('short',req.shortUrl);
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

             // Save to database
    try{
            await insert(short, original, userId);
                res.status(302).json({
                        "shorturl": short,
                        "originalurl": original
                    });
        }catch(err){
                res.status(400).send('error occured while inserting the url into db');
            }
            
    }).catch((error)=>{
        console.log(error);
        return res.status(400).json({ message: 'Please enter a valid url' });
    })
});

async function insert(short, original ,user_id) {
    try{
        console.log('inserting',user_id);
        const query = 'INSERT INTO userdata (short_url, long_url , user_id) VALUES (?, ? ,?)';
        
        const [result] = await db.execute(query, [short, original,user_id]);
        
        //urlmap[short]=original;
        
        
    }catch(err){
        
        console.log(err);
        throw err;
        
    }
    
}

app.put('/deletedata', async (req, res) => {
    const data = req.body.item.short;
    const {userId} =getAuth(req);
    console.log('delereeee',userId);
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
    console.log(userId);
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
    console.log('redirect',userId);
    const code =`http://localhost:3000/${req.params.code}`;
    
    if (!code) return res.status(404).send('no url found');
    
    const query ='SELECT long_url from userdata where short_url = ? and user_id = ?';
    const [result] =await db.execute(query,[code,userId]);
    return res.redirect(result[0].long_url);
})


app.listen(3000, () => {
    console.log('server is listening...')
})


// async function getdata(short, original) {
    //     try {
        //         let existingdata = {}
        //         try {
            
        //             const data = await readFile('./urldata.json', 'utf8');
        //             existingdata = JSON.parse(data);
        //         } catch (err) {
            //             existingdata = {}
            //         }
            
            //         existingdata[short] = original;
            
            //         await writeFile('./urldata.json', JSON.stringify(existingdata));
            //         console.log('54-');
            
            //     } catch (err) {
                //         console.log(err);
                //     }
                //     console.log('getdata');
                // }
                
                
                
                // function url(req, res, next) {
                    //     console.log('url middleware');
                    //     next();
                    // }
                    
                    
                    // for (const key of Object.keys(urlmap)) {
                        //     if (urlmap[key] === original) {
                            //         console.log('key '+key);
                        //         return res.status(302).json({
                            //             "shorturl": `http://localhost:3000/${key}`,
                            //             "originalurl": original
                            //         });
            //     }
            // }


            // async function readfromurldata() {
            // try {
            //     const query = 'SELECT * FROM userdata';
                
            //     const [rows] = await db.execute(query);
                
            //     rows.forEach(row => {
            //             urlmap[row.short_url] = row.long_url;
            //         });
            
            //         console.log('dataa -',urlmap);
            //         console.log('done');
            //     } catch (err) {
                //         console.log("No previous data. Starting fresh.");
                //     }
            // }
            

                // for (const key of Object.keys(urlmap)) {
                    //     if (urlmap[key] === original) {
                        //         return res.status(200).json({
                            //             "shorturl": key,
                            //             "originalurl": original
                            //         });
                            //     }
                            // }
                            
                            // check((err,result)=>{
                                //     if(err){
                                    //         console.log(err);
                                    //     }else{   
                                        //         console.log(result);
                                        //     }
                                        // },original);