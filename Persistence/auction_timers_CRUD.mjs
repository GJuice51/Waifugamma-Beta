import mysql from 'mysql2/promise';
import { day } from '../Business/constants.mjs';
import schedule from 'node-schedule';
import { HANDLER_CHAT_CHANNEL_ID } from '../Business/constants.mjs';
import {client} from '../Business/constants.mjs';

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

export async function loadAuctionTimers(channels, channelIDs){
    const pool = await getConnection();
    try{
        const connection = await pool.getConnection();

        const sql = `SELECT * FROM GammaDB.auction_timers;`;
        const records = await connection.query(sql);
        
        connection.release();
        pool.end();

        for(var i = 0; i < 8; i++){
            if(records[0][i].date === "Done"){ 
                channels.get(channelIDs[i]).date = records[0][i].date;
                channels.get(channelIDs[i]).status = "Done";
                channels.get(channelIDs[i]).auctionCountDown = "Done";
                channels.get(channelIDs[i]).auctionCDISOString = "Done";
            }else{
                channels.get(channelIDs[i]).updateDate(new Date(records[0][i].date), day);
            }
            channels.get(channelIDs[i]).auctionStringArray = records[0][i].auctionStringArray;

            if(channels.get(channelIDs[i]).auctionCDISOString != "Done"){
                loadScheduledAuction(channels, channelIDs[i]);

            }
        }

    }catch (error) {
        console.error('Error loading auction timers: ', error);
    }
}

async function loadScheduledAuction(channels, channelID){
    const auctionChannel = client.channels.cache.get(channelID);
    const privchannel = client.channels.cache.get(HANDLER_CHAT_CHANNEL_ID); 
    schedule.scheduleJob(new Date(channels.get(channelID).auctionCDISOString), () => {
        channels.get(channelID).finishAuction();
        auctionChannel.send("Waiting...");
        privchannel.send('<#' + channelID + '> is done.');
        updateAuctionTimer(channels, channelID);
        
    });
}


export async function updateAuctionTimer(channels, channelID){
    const pool = await getConnection();
    try{
        const connection = await pool.getConnection();
        let values;
        const sql = `UPDATE GammaDB.auction_timers SET date = ?, status = ?, auctionCountDown = ?, auctionStringArray = ?, auctionCDISOString = ? WHERE channelID = ?;`;
        if(channels.get(channelID).date === "Done"){
            values = ["Done", channels.get(channelID).status, channels.get(channelID).auctionCountDown, channels.get(channelID).auctionStringArray, channels.get(channelID).auctionCDISOString, channelID];
        }else{
            values = [channels.get(channelID).date.toISOString(), channels.get(channelID).status, channels.get(channelID).auctionCountDown, channels.get(channelID).auctionStringArray, channels.get(channelID).auctionCDISOString, channelID];
        }
        await connection.query(sql, values);
        
        connection.release();
        pool.end();

    }catch (error) {
        console.error('Error updating auction timer: ', error);
    }
}

// export function auctionToFile(auctionTimesFile, channels, channelIDs){
//     var dataAsString = "";
//     for(var i = 0; i < 8; i++){
//       var date = channels.get(channelIDs[i]).date;
//       if(date === "Done"){
//         if(i == 7)
//           dataAsString += "Done";
//         else
//           dataAsString += "Done%@%";
//       }
//       else if(i == 7)
//         dataAsString += date.toISOString();
//       else
//         dataAsString += date.toISOString() + "%@%";
//     }
  
//     dataAsString += "!@#$%^&*";
//     for(var i = 0; i < 8; i++){
//       if(i == 7)
//         dataAsString += channels.get(channelIDs[i]).auctionStringArray;
//       else
//         dataAsString += channels.get(channelIDs[i]).auctionStringArray + "$@$";
//     }
//     writeFileSync(auctionTimesFile, dataAsString);
//   }


// export function fileToData(auctionTimesFile, channels, channelIDs){
//     const fileData = readFileSync(auctionTimesFile, 'utf8');
//     const breakSections = fileData.split('!@#$%^&*');
//     const splitDates = breakSections[0].split('%@%');
    
//     const splitAuctionStringArray = breakSections[1].split('$@$');
  
//     for(var i = 0; i < 8; i++){
//       var chan = channels.get(channelIDs[i]);
  
//       if(splitDates[i] === "Done"){ 
//         chan.date = "Done";
//         chan.status = "Done";
//       } else {
//         chan.updateDate(new Date(splitDates[i]), day);
//       }
//       chan.auctionStringArray = splitAuctionStringArray[i];
//     }
//   }