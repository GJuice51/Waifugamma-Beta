
import mysql from 'mysql2/promise';

async function getConnection() {
 
  const pool = await mysql.createPool({
      host: process.env.DB_HOST, // '25.74.119.213', 
      user:  process.env.DB_USER,// 'andrew', 
      password: process.env.DB_PASSWORD, // 'adminPwd', 
      database: 'GammaDB', 
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
  });

  return pool;
}

export async function selectAuctionMenu_INSERT(emoji, eventname){
    const pool = await getConnection();
    try{
        const connection = await pool.getConnection();

        const sql = `INSERT INTO GammaDB.auction_select_menu (emoji, event_name) VALUES ('${emoji}', '${eventname}');`;
        await connection.query(sql);

        connection.release();
        pool.end();
    }catch (error) {
        console.error('Error inserting auction: ', error);
    }
}

export async function selectAuctionMenu_DELETE(eventname){
    console.log("Name: " + eventname);
    const pool = await getConnection();

    try {
      const connection = await pool.getConnection();
      
      const sql = `DELETE FROM GammaDB.auction_select_menu WHERE event_name= \"${eventname}\";`;
      await connection.query(sql);
      
      connection.release();
      pool.end();
    } catch (error) {
      console.error('Error: ', error);
    }
}

export async function getAllEvents_READ(){
    const pool = await getConnection();

    try {
      const connection = await pool.getConnection();
      
      const sql = `SELECT emoji, event_name FROM GammaDB.auction_select_menu;`;
      const records = await connection.query(sql);
      
      connection.release();
      pool.end();
      return records[0];
      
    } catch (error) {
      console.error('Error reading events: ', error);
    }
}
