
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

export async function cardLastAuctioned_INSERT(id){
    const pool = await getConnection();

    // Connect to the MySQL server
    try {
        const connection = await pool.getConnection();

        // Check if card has been auctioned for first time
        const find = `SELECT globalID FROM GammaDB.cardLastAuctioned WHERE globalID = \"${id}\";`;
        const records = await connection.query(find);

        // Update Database
        var sql = "";
        if (records[0].length == 0){
            sql = `INSERT INTO GammaDB.cardLastAuctioned (globalID, date, timesAuctioned) VALUES ('${id}','${new Date()}', 1)`;
        } else {
            sql = `UPDATE GammaDB.cardLastAuctioned 
            SET date = '${new Date()}', timesAuctioned = timesAuctioned + 1 
            WHERE globalID = \"${id}\";`;
        }
        await connection.query(sql);
        connection.release();
        pool.end();
           
      } catch (error) {
        console.error('Error inserting: ', error);
      }
  }

  export async function cardLastAuctioned_READ(id){
    const pool = await getConnection();

    try {
      const connection = await pool.getConnection();
      
      const sql = `SELECT * FROM GammaDB.cardLastAuctioned WHERE globalID = \"${id}\";`;
      const records = await connection.query(sql);    
      connection.release();
      pool.end();
      return records[0][0];
      
    } catch (error) {
      console.error('Error reading: ', error);
    }
}
