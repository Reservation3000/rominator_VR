import express from 'express';
import cors from 'cors';
import mysql from 'mysql2'
import { WebSocketServer } from 'ws';

const app = express();

app.use(cors());   
app.use(express.json());

const connection = mysql.createConnection({   
  host     : 'localhost',
  user     : 'root',
  password : '0906468525',
  database : 'VRmgDB'
});

// 設定只允許特定的前端來源存取
// const corsOptions = {
//     origin: 'http://localhost:5173', 
//     optionsSuccessStatus: 200
// };

// app.get("/api/VRmgDB/data", cors(corsOptions) , (req, res) => {
app.get("/api/VRmgDB/data", (req, res) => {

    const sql = "SELECT id, name, song_artist, sheet_artist, level, bpm, mp3, csv, img FROM VRMgTable";
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error("Server error:", err);
            return res.status(500).json({ error: "Server error", details: err.message });
        }

        console.log(`Number of songs server get: ${results.length}`);
        return res.json(results); // return the results as JSON for Frontend
    });
});


// ========================================================================= 
// 抓取圖片／音樂的代理路由==================================================== //需要sql先不架
// =========================================================================
app.get('/api/proxy/media', async (req, res) => {

    const mediaUrl = req.query.url;

    if (!mediaUrl || typeof mediaUrl !== 'string') {
      return res.status(400).json({ error: 'Missing url' });
    }

    let target;
    try {
      target = new URL(mediaUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid url' });
    }

    if (target.protocol !== 'https:' || target.hostname !== 'mg.reservationfurry.art') {
      return res.status(403).json({ error: 'Host not allowed' });
    }

    try {
      const upstream = await fetch(target.toString());
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: 'Upstream failed' });
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const body = Buffer.from(await upstream.arrayBuffer());

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(body);
    } catch (error) {
      console.error('Media proxy error:', error);
      return res.status(502).json({ error: 'Proxy failed' });
    }
  });


 app.listen(8081, () => {
    console.log("server running");
  });


connection.connect(function(err) {
    if (err) {
      console.error('MySQL connection failed：', err);
      return;
    }
    console.log('MySQL connection');
  });
