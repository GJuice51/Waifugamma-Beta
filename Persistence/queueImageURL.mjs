
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
export async function queueImageURL_INSERT(qmID, gcs){
  const pool = await getConnection();

  try {
        const connection = await pool.getConnection();

        const sql = `INSERT INTO GammaDB.queueImageURL (queueMessageID, currentpic, imgurl1, rarity1, imgurl2, rarity2) 
            VALUES ('${qmID}', 1, '${gcs[0].imgURL}', ${gcs[0].getBorderColor()}, '${gcs[1].imgURL}',${gcs[1].getBorderColor()} )`;
        await connection.query(sql);
        connection.release();
        pool.end();
            
        console.log('Updated successfully');
    } catch (error) {
      console.error('Error inserting: ', error);
    }
  }


export async function queueImageURL_DELETE(qmID){
  const pool = await getConnection();

  try {
    const connection = await pool.getConnection();
    const sql = `DELETE FROM GammaDB.queueImageURL WHERE queueMessageID = \"${qmID}\";`;
    await connection.query(sql);
    connection.release();
    pool.end();
  } catch(e) {
    console.error('Error removing.', e);
  }
}

// update pic in database and return new pic/rarity
export async function flipPic(qmID){
    const pool = await getConnection();

    try {
        const connection = await pool.getConnection();
        const queryselect = `SELECT * FROM GammaDB.queueImageURL WHERE queueMessageID = \"${qmID}\";`
        const records = await connection.query(queryselect); 
        const ps = records[0][0];
        if (!ps) return ps;
        
        const newPic = (ps.currentpic == 2)? 1 : 2;
        const queryupdate = `UPDATE GammaDB.queueImageURL 
            SET currentPic = ${newPic}
            WHERE queueMessageID = \"${qmID}\";`;
        await connection.query(queryupdate);    
        connection.release();
        pool.end();
        
        if (ps.currentpic === 2) {
            return {imgURL : ps.imgURL1 , borderCol: ps.rarity1};
        } else  {
            return {imgURL : ps.imgURL2 , borderCol: ps.rarity2};
        }
       
    } catch (error) {
        console.error(error);
    }
}

