
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
export async function lastAuctioned_INSERT(userID){
  const pool = await getConnection();

  try {
      const connection = await pool.getConnection();

      // Check if user has auctioned for first time
      const find = `SELECT userID FROM GammaDB.lastauctioned WHERE userID = \"${userID}\";`;
      const records = await connection.query(find);

      // Update Database
      var sql = "";
      if (records[0].length == 0){
          sql = `INSERT INTO GammaDB.lastauctioned (userID, date) VALUES ('${userID}','${new Date()}')`;
      } else {
          sql = `UPDATE GammaDB.lastauctioned SET date = '${new Date()}' WHERE userID = \"${userID}\";`;
      }
      await connection.query(sql);
      connection.release();
      pool.end();
          
    } catch (error) {
      console.error('Error inserting: ', error);
    }
  }

export async function lastAuctioned_READ(userID){
  const pool = await getConnection();

  try {
    const connection = await pool.getConnection();
    
    const sql = `SELECT * FROM GammaDB.lastauctioned WHERE userID = '${userID}';`;
    const records = await connection.query(sql);    
    connection.release();
    pool.end();
    return records[0][0];
    
  } catch (error) {
    console.error('Error reading: ', error);
  }
}

export async function lastAuctioned_DELETE(userID){
  const pool = await getConnection();

  try {
    const connection = await pool.getConnection();
    const sql2 = `DELETE FROM GammaDB.lastauctioned WHERE userID = \"${userID}\";`;
    await connection.query(sql2);
    connection.release();
    pool.end();
  } catch(e) {
    console.error('Error removing:', e);
  }
}

