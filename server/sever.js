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
// 抓取圖片的代理路由=========================================================
// =========================================================================
app.get('/api/proxy/image', async (req, res) => {

    const imageUrl = req.query.url;

    // 如果沒有URL或URL不是字串，回傳400錯誤
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'Missing url' });
    }

    let target = new URL(imageUrl); // 將字串轉換為URL物件

    // 強制規定目標網址的協定必須是 https:，且主機名稱（hostname）必須是 mg.reservationfurry.art
    if (target.protocol !== 'https:' || target.hostname !== 'mg.reservationfurry.art') {
      return res.status(403).json({ error: 'Host not allowed' });
    }

    try {
      const upstream = await fetch(target.toString());
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: 'Upstream failed' });
      }

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const body = Buffer.from(await upstream.arrayBuffer());

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(body);
    } catch (error) {
      console.error('Image proxy error:', error);
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
