
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
export async function warnings_INSERT(log){
    const pool = await getConnection();

    // Connect to the MySQL server
    try {
        const connection = await pool.getConnection();
        
        // Perform the database operation
        const wID = Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9*Math.pow(10, 12)).toString(36);
        const sql = `INSERT INTO GammaDB.warnings_crud (warningID, userID, reason, warnDate, handlerID) VALUES ('${wID}','${log.userID}','${log.reason}','${log.date}','${log.handlerID}')`;
        await connection.query(sql);
        
        connection.release();
        pool.end();
        
      } catch (error) {
        console.error('Error inserting warning: ', error);
      }
  }

  export async function warnings_READ(userID){
    const pool = await getConnection();

    try {
      const connection = await pool.getConnection();
      
      const sql = `SELECT * FROM GammaDB.warnings_crud WHERE userID = ${userID};`;
      const records = await connection.query(sql);
      
      connection.release();
      pool.end();
      return records[0];
      
      //console.log('Table created successfully');
    } catch (error) {
      //console.error('Error creating table: ', error);
    }
}

export async function warnings_DELETE(warnID){
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    // Perform the database operations
    const sql1 = `SELECT warningID FROM GammaDB.warnings_crud WHERE warningID = \"${warnID}\";`;
    const records = await connection.query(sql1);
    if (records[0].length == 0)
        throw 1;

    try {
        const sql2 = `DELETE FROM GammaDB.warnings_crud WHERE warningID = \"${warnID}\";`;
        await connection.query(sql2);

        connection.release();
        pool.end();
    } catch(e) {
        console.error('Error removing warning', e);
    }

}