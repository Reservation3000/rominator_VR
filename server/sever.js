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
const server = new WebSocketServer({ port: 8080 });   //建立Websocket服務器，監聽8080端口
const clients = new Map(); // 儲存客戶端連接的 Map


app.get("/api/VRmgDB/data", (req, res) => {

    const sql = "SELECT id, name, song_artist, sheet_artist, level, bpm, mp3, csv, img FROM baseTable";
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error("Server-Backend connected to SQL VRmgDB error:", err);
            return res.status(500).json({ error: "Server-Backend connected to SQL VRmgDB error", details: err.message });
        }

        console.log(`Number of songs server get: ${results.length}`);
        res.json(results); // return the results as JSON for Frontend
    });
});

 app.listen(3306, () => {
    console.log("server running");
  });


connection.connect(function(err) {
    if (err) {
      console.error('MySQL connection failed：', err);
      return;
    }
    console.log('MySQL connection');
  });
