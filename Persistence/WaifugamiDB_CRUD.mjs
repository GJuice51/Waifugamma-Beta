import mysql from 'mysql2/promise';

async function getConnection() {

    // CHANGE THE INFO HERE
    const pool = await mysql.createPool({
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: 'waifugami',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    return pool;
}


export async function getEventFromGlobalID(globalID) {
    const pool = await getConnection();
    
    try{
        const connection = await pool.getConnection();

        const query = `SELECT fk_image_id FROM waifugami.claim WHERE global_id = ?;`;
        //const query = `SELECT fk_image_id FROM claim WHERE global_id = ?;`;
        const values1 = [globalID];
        const records = await connection.query(query, values1);

        //Failsafe in case the image ID is not found. Shouldn't ever happen.
        if (records.length === 0) {
            connection.release();
            pool.end();
            return " "; 
        }
        
        const query2 = `SELECT event_name FROM waifugami.image WHERE image_id = ?;`;
        //const query2 = `SELECT event_name FROM image WHERE image_id = ?;`;
        const values2 = [records[0][0].fk_image_id];
        const records2 = await connection.query(query2, values2);

        connection.release();
        pool.end();

        //In case the event name is not found/NULL.
        if (records2.length === 0 || records2[0][0].event_name === null) {
            return " ";
        }

        return formatEventString(records2[0][0].event_name);

    }catch (error) {
        console.error('Error getting event: ', error);
        return " ";
    }
}



function formatEventString(input) {
    const parts = input.split(/(\d+)/);
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)+ " " + parts[1];
}