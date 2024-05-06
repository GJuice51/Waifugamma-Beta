
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

export async function bans_INSERT(log){
    const pool = await getConnection();

    // Connect to the MySQL server
    try {
        const connection = await pool.getConnection();
        
        const sql = `INSERT INTO GammaDB.bans_crud (userID, reason, handlerID, banDate) VALUES ('${log.userID}','${log.reason}','${log.handlerID}','${log.date}')`;
        await connection.query(sql);
        
        connection.release();
        pool.end();
        
      } catch (error) {
        console.error('Error inserting ban: ', error);
      }
  }

  export async function bans_READ(userID){
    const pool = await getConnection();

    try {
      const connection = await pool.getConnection();
      
      const sql = `SELECT * FROM GammaDB.bans_crud WHERE userID = ${userID};`;
      const record = await connection.query(sql);
      
      connection.release();
      pool.end();
      return record[0][0];

    } catch (error) {
      console.error('Error reading table: ', error);
    }
}

export async function bans_DELETE(userID){
    const pool = await getConnection();

    try {
      const connection = await pool.getConnection();
      
      const sql = `DELETE FROM GammaDB.bans_crud WHERE userID=${userID};`;
      await connection.query(sql);
      
      connection.release();
      pool.end();
      
      //console.log('Table created successfully');
    } catch (error) {
      //console.error('Error creating table: ', error);
    }
}