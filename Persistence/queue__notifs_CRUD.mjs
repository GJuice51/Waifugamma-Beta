
import mysql from 'mysql2/promise';
import { queueReacted } from '../Business/objects.mjs';

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


export async function getUserAndDeleteNotifs(messageID) {
    const pool = await getConnection();
    try{
        const connection = await pool.getConnection();

        const query = `SELECT userID, messageContent FROM GammaDB.queue_notifs WHERE messageID = ?;`;
        const values = [messageID];
        const record = await connection.query(query, values);

        const deleteQuery = `DELETE FROM GammaDB.queue_notifs WHERE messageID = ?;`;
        await connection.query(deleteQuery, values);

        connection.release();
        pool.end();

        return record[0];
    }catch (error) {
        console.error('Error getting queue notification data OR delete data: ', error);
    }
}

export async function insertQueueNotifs(messageID, userID, messageContent) {
    const pool = await getConnection();
    try{
        const connection = await pool.getConnection();

        const query = `INSERT INTO GammaDB.queue_notifs (messageID, userID, messageContent) VALUES (?, ?, ?);`;
        const values = [messageID, userID, messageContent];
        await connection.query(query, values);

        connection.release();
        pool.end();

    }catch (error) {
        console.error('Error inserting queue notification data: ', error);
    }
}

export async function readQueueNotifs(){
    const pool = await getConnection();
    try{
        const connection = await pool.getConnection();

        const query = `SELECT * FROM GammaDB.queue_notifs;`;
        const record = await connection.query(query);

        connection.release();
        pool.end();


        record[0].forEach((notif) => {
            if(!queueReacted.has(notif.messageID)){
                queueReacted.set(notif.messageID, [notif.userID]);
            }else{
                queueReacted.get(notif.messageID).push(notif.userID);
            }

        });

    }catch (error) {
        console.error('Error reading queue notification data on Client.READY: ', error);
    }
}