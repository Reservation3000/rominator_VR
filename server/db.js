import mysql from "mysql2";
import fs from "fs";
import path from "path";
import 'dotenv/config';


const connection = mysql.createConnection({   
  host     : 'localhost',
  user     : 'root',
  password : process.env.DB_PASSWORD,
  database : 'VRmgDB'
});

//connection
connection.connect(function(err) {
    if (err) {
      console.error('DB connection failed：', err);
      return;
    }
    console.log('DB connection');
  });

importSongs();




// existed(已經在db的資料) <=> meta(本地資料) <=> newSongs(本地需要新上傳的資料)
function importSongs() {

//== 抓整個 JSON 檔案內容 ========================================================================
    const dataPath = path.join("./assest/VRsongData.json");

    let meta;   // 整個 JSON 檔案的內容
    try {
        meta = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch (e) {
        console.log(`JSON parsing failed: ${dataPath}`+ e.message);
        return;
    }

//== 把所有歌曲的 id 組成一個陣列 =================================================================
    const ids = meta.map(song => song.id); 

//== 查詢資料庫中已存在的歌曲 id，並找出新的歌曲 ===================================================
    //connection.query(SQL語句, SQL參數, callback(錯誤資訊，執行結果))
    connection.query("SELECT id FROM VRMgTable WHERE id IN (?)",[ids],(err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        const existed = new Set(rows.map(r => r.id));  //Set 物件可儲存任何類型的唯一值

        const newSongs = meta.filter(song => !existed.has(song.id));   //filter 把符合條件的留下；newSong存入song中符合!existed.has(song.id)條件的資料

        if (newSongs.length === 0) {
            console.log("No new songs to add.");
            connection.end();
            return;
        }

//== 將新歌曲物件，轉換成二維陣列，並加入資料庫 =======================================================================
        const values = newSongs.map(song => [
            song.id,
            song.name,
            song.song_artist,
            song.sheet_artist,
            song.level,
            song.bpm,
            song.mp3,
            song.csv,
            song.img
        ]);

        const sql = `INSERT INTO VRMgTable(
            id, 
            name, 
            song_artist, 
            sheet_artist, 
            level, bpm, 
            mp3, csv, 
            img)
            VALUES ?`;  // 寫？時，mysql2 會在底層自動把資料「翻譯」純文字 SQL 語法。

        connection.query(sql, [values], (err, result) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(`Update ${result.affectedRows} rows`);

            console.log("Update：");
            newSongs.forEach(song => {
                console.log(`[ID: ${song.id}] ${song.name}`);
            });

            connection.end();
        });
    });
}