// List of commands: 
// timers, auction, lb, ca, close, ( deprecated: addevent, deleteevent) 
// syncqueue, ban, unban, warn, removewarning, warnings,
// sethandlerlength, resetcooldown

// THINGS TO CHANGE BEFORE SENDING TO PRODUCTION
// channelIDs - list of auction channels
// AUCTION_ROLES
// AUCTION_COOLDOWN, AUCTION_LENGTH

import { config } from 'dotenv';
config();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
import schedule from 'node-schedule';

// Discord Stuff
import { EmbedBuilder } from 'discord.js';
import { client } from './Business/constants.mjs';

// Function Imports
import { displayLB, displayTimers, displayHelp, writeToLog, containsAuctionRoles, closeChannel, createTicketDM, ticketHelper, reloadMessages, resetCD} from './Business/Functions/FunctionBroker.mjs';

// Constant Imports 
import { second, hour, day, AUCTION_LENGTH} from './Business/constants.mjs';
import { channelIDs, aucBannedRoleName, handlerRoleName } from './Business/constants.mjs';
import { GUILD_ID, TICKET_CAT_ID, QUEUE_CHANNEL_ID, AUCTION_CHAT_ID, HANDLER_CHAT_CHANNEL_ID} from './Business/constants.mjs';

// Object Imports
import { handlerClaims, ChannelOBJ, queueReacted } from './Business/objects.mjs';

// System Imports
import { updateWin} from './Business/spreadsheetMJS.mjs';
import { addEvent, deleteEvent } from './Business/auctionDM.mjs';
import { messageReactionAddHandler } from './Business/reactions.mjs';
import { auctionban, auctionunban, auctionwarn, auctionremovewarn, displaywarnings } from './Business/auctionModeration.mjs';
import { bans_READ } from './Persistence/bans_CRUD.mjs';
import { loadAuctionTimers, updateAuctionTimer } from './Persistence/auction_timers_CRUD.mjs';
import { queueImageURL_DELETE } from './Persistence/queueImageURL.mjs';
import { getUserAndDeleteNotifs, readQueueNotifs } from './Persistence/queue__notifs_CRUD.mjs';



const logger = {
  log: async (message) => writeToLog(message),
  error: async (errorMessage) => writeToLog(`[ERROR] ${errorMessage}`),
};

// Construct array of channels
var channels = new Map();
for (let i = 0; i <= 8; i++) {
  channels.set(channelIDs[i], new ChannelOBJ())
}

//const auctionTimesFile = "auctionTimes.txt";
var AUCTION_LENGTH_HANDLER = 24 * hour;


/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                              Main
/////////////////////////////////////////////////////////////////////////////////////////////////////
client.on('ready', async () => {
  // Load past auctions
  //fileToData(auctionTimesFile, channels, channelIDs); //CHANGE THIS
  loadAuctionTimers(channels, channelIDs);

  //Fill in existing queue notif data
  readQueueNotifs();

  // Reload handling messages
  reloadMessages()
  .then(() => console.log('The bot is ready.'))
  .catch(err => console.error(err));
})


client.on('messageCreate', async message => {

  // Ignore bot reactions
  if (message == null || message.author == null || (message.guild && (message.channel == null || message.channel.parent == null))) {
    console.error("1. Something was null...");
    return;
  }

  // Add a new auction
  if(containsAuctionRoles(message.content) && message.content.toLowerCase().includes('item 1')){ 
    const getchannel = await client.channels.fetch(message.channel.id);
    
    const channelString = '' + getchannel;
    if(!channelIDs.includes(channelString))
      return;
    
    // Get the character names from message
    channels.get(channelString).updateAucStringArray(message.content);

    // Check if auctioneer is a handler
    var aucLen = AUCTION_LENGTH;
    const userMention = message.mentions.users.first();
    if (userMention) {
      const handlerRole = message.guild.roles.cache.find((role) => role.name === handlerRoleName);
      const auctioneer = await message.guild.members.fetch(userMention.id);
      const hasHandlerRole = auctioneer.roles.cache.has(handlerRole.id); 
      if (hasHandlerRole) {
        aucLen = AUCTION_LENGTH_HANDLER;
      }
    }

    // Configure timers
    const currentTime = new Date();
    channels.get(channelString).updateDate(currentTime, aucLen); 
    const endAuctionDate = new Date(currentTime.getTime() + aucLen); 
    
    
    //auctionToFile(auctionTimesFile, channels, channelIDs); // Save auction to a file //CHANGE THIS
    //console.log(channels);
    updateAuctionTimer(channels, channelString);

    // End the auction after 24h
    const privchannel = client.channels.cache.get(HANDLER_CHAT_CHANNEL_ID); 
    schedule.scheduleJob(endAuctionDate, () => {
      channels.get(channelString).finishAuction();
      message.reply("Waiting...");
      privchannel.send('<#' + getchannel + '> is done.');
      //auctionToFile(auctionTimesFile, channels, channelIDs);
      updateAuctionTimer(channels, channelString);

      const [queueMsgID, nextHandlerID] = handlerClaims.top()[0]; // ping the next handler
      if (nextHandlerID == null){
        handlerClaims.delete(queueMsgID);
        return;
      }
      privchannel.send("<#" + QUEUE_CHANNEL_ID + ">: <@" + nextHandlerID + ">");
    });

    // Display open channels and timers
  } else if(message.content.startsWith('!timers') && message.channel.id === HANDLER_CHAT_CHANNEL_ID){
    const privchannel = client.channels.cache.get(HANDLER_CHAT_CHANNEL_ID);
    displayTimers(privchannel, channelIDs, channels);
  
    // Display current auctions
  } else if(message.content == '!auction' || message.content == '!auctions' ){
    const getchannel = await client.channels.fetch(message.channel.id);
  
    var s = '';
    const embedAuction = new EmbedBuilder().setTimestamp();

    for(let i = 0; i < 8; i++){
      var chan = channels.get(channelIDs[i]);
      if(chan.status !== 'Done'){
        embedAuction.addFields(
          {name: ' > <#' + channelIDs[i] + '>' + ' — ' + chan.auctionCountDown, value: chan.auctionStringArray}
        );
        s += ' > <#' + channelIDs[i] + '>\n' +  chan.auctionStringArray;
      }
    }

    if(s === ""){
      embedAuction.setColor(0xfc0303);
      embedAuction.setTitle('No auctions available.');
    } else{
      embedAuction.setColor(0x4CEB34);
      embedAuction.setTitle('Active Auctions');
    }
      

    getchannel.send({ embeds: [embedAuction]});

  //   // Admin command - clear auctions
  // } else if(message.content.startsWith('!clearauctions') && (message.author.id == GJUICE_ID || message.author.id == AGUA_ID)) {  
  //   try{
  //     for (let i = 0; i<= 8; i++) {
  //       channels.get(channelIDs[i]).finishAuction();
  //     }
  //     //auctionToFile(auctionTimesFile, channels, channelIDs);
  //     updateAuctionTimer(channels, channelString);
  //     message.reply("Auctions have been cleared!");
  //   } catch(e) {
  //     console.error(e); 
  //   }

    // Sync the queue up so that it pings handlers in order
  } else if (message.content.startsWith('!syncqueue') && message.channel.id === HANDLER_CHAT_CHANNEL_ID) {
    reloadMessages()
    .then(() => message.reply("Synced up queue channel!"));
    
      
    // Display leaderboard of bidder winners
  } else if(message.content.startsWith('!lb') && message.channel.id == AUCTION_CHAT_ID){
    displayLB(message);
 
  } else if(message.content.toLowerCase().includes('taking') && message.content.toLowerCase().includes('<@')){
    const getchannel = await client.channels.fetch(message.channel.id);

    if(!channelIDs.includes('' + getchannel))
      return;
  
    function getStringBid(str, start){
      var end, shift;
      if(start == '@'){
        end = ">";
        shift = 1;
      } else if (start == "for"){
        end = "\n";
        shift = 4;
      } else {
        return;
      }

      var begin = str.indexOf(start) + shift;
      var close = str.indexOf(end);
      return str.slice(begin, close);
    }

    var endAucMsg = message.content;
    const numPings = endAucMsg.replace(/[^@]/g, "").length;
    const sleep = (duration) => {
      return new Promise(resolve => setTimeout(resolve, duration));
    }

    //Test Case 1: 2 IDs in 2 different lines
    if(numPings == 2 && endAucMsg.includes("\n")){
      var delim = endAucMsg.indexOf('\n');
      var msg1 = endAucMsg.slice(0, delim) + "\n";
      var msg2 = endAucMsg.slice(delim + 1) + "\n";
      var id2 = getStringBid(msg2, "@");
      var char2 = getStringBid(msg2, "for");
      var id1 = getStringBid(msg1, "@");
      var char1 = getStringBid(msg1, "for")

      updateWin(id1, char1);
      sleep(5000).then(() => {
        updateWin(id2, char2);
      })
    

    // Test Case 2: 2 IDs in 1 line
    } else if(numPings == 2){
      var delim = endAucMsg.indexOf('and');
      var msg1 = endAucMsg.slice(0, delim);
      var msg2 = endAucMsg.slice(delim) + ' ';
      var id2 = getStringBid(msg2, "@");
      var char2 = getStringBid(msg2, "for");
      var id1 = getStringBid(msg1, "@");
      var char1 = getStringBid(msg1, "for")

      updateWin(id1, char1);
      sleep(5000).then(() => {
        updateWin(id2, char2);
      })


      // Test Case 3: 1 ID, 2 wins
    } else if(numPings == 1 && endAucMsg.includes("and")) {
      var delim = endAucMsg.indexOf('and');
      var msg1 = endAucMsg.slice(0, delim);
      var msg2 = endAucMsg.slice(delim) + ' ';
      var char2 = getStringBid(msg2, "for");
      var id1 = getStringBid(msg1, "@");
      var char1 = getStringBid(msg1, "for")

      updateWin(id1, char1);
      sleep(5000).then(() => {
        updateWin(id1, char2);
      })
      

      // Test Case 4: 1 ID, 1 win
    } else if(numPings == 1){
      var msg1 = endAucMsg + '\n';
      var id1 = getStringBid(msg1, "@");
      var char1 = getStringBid(msg1, "for")

      updateWin(id1, char1);
    }

  } else if (message.content.startsWith('!sethandlerlength') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
      // change the auction length only for handlers (default is 20h)
      try {    
        const args = message.content.split(' ');    
        if (args.length != 2 || !(/^\d+$/.test(args[1]))) {
          throw 1;
        }
        AUCTION_LENGTH_HANDLER = parseInt(args[1]) * hour;
        message.channel.send("Set handler auction length to " + args[1] + "h.");
      } catch(e) {
        message.reply("Something went wrong...");
        console.log(e);
      }

  } else if (message.content.startsWith('!help') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    displayHelp(message);
    
    //////////////////////////////////////////////////////////////////////////////////////////////
    //                              Auction bot ticket system 
    //////////////////////////////////////////////////////////////////////////////////////////////

  } else if(!message.author.bot && !message.guild && !message.content.startsWith('!ca')){
    message.reply('Hello, this is Waifugami\'s auction manager! Please type `!ca` to create an auction ticket.');

    
  } else if(!message.author.bot && !message.guild && message.content.startsWith('!ca') ){
    createTicketDM(message);

  // Occurs when user sends commands in their auction ticket channel
  } else if(message.author.id == '722418701852344391' && message.channel.parent.id === TICKET_CAT_ID) {
    ticketHelper(message);
    

  } else if (message.content.startsWith('!close')) {
    try{ closeChannel(message.channel); }
    catch(e) { console.error(e); }
   

    // Add a new event option.
  // } else if(message.content.startsWith('!addevent') && message.channel.id === HANDLER_CHAT_CHANNEL_ID){   
  //   addEvent(message);

  // // Delete an event option from select menu.
  // } else if(message.content.startsWith('!deleteevent') && (message.author.id == GJUICE_ID || message.author.id == AGUA_ID)){
  //   deleteEvent(message);


  } else if (message.content.startsWith('!resetcooldown') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    resetCD(message);
    
  
    ///////////////////////////////////////////////////////////////////////////////////////////////
    //                                Auction Moderation System
    ///////////////////////////////////////////////////////////////////////////////////////////////
  } else if (message.content.startsWith('!ban') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    auctionban(message);
    
  } else if (message.content.startsWith('!unban') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    auctionunban(message);
    
  } else if (!message.content.startsWith('!warnings') && message.content.startsWith('!warn') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    auctionwarn(message);

  } else if (message.content.startsWith('!removewarning') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    auctionremovewarn(message);

  } else if (message.content.startsWith('!warnings') && message.channel.id === HANDLER_CHAT_CHANNEL_ID ) {
    displaywarnings(message);
  } 
    
    ///////////////////////////////////////////////////////////////////////////////////////////////
    //                                COMMANDS TESTING 
    ///////////////////////////////////////////////////////////////////////////////////////////////
   //else if (message.content.startsWith('!embed')) {
  //   // Add to auction-handling
  //   const aucHandlingChan = client.channels.cache.get(AUCTION_HANDLING_CHANNEL_ID);
  //   const newEmbed = new EmbedBuilder()
  //     .setTimestamp()
  //     .addFields(
  //       {name: ' ', value: "Auctioneer: <@" + GJUICE_ID + '>'},
  //       {name: ' ', value: "Item 1: [ζ] Gawr Gura (4031)"},
  //       {name: ' ', value: "Item 2: Halloween 2023 [ζ] Nagito Komaeda (1634)"}
  //     )
  //     .setFooter({text: "Last ticket: N/A" })
  //     .setColor(0xFF0000);
  //   aucHandlingChan.send( { embeds: [newEmbed]} )
  //     .then(message => {
  //       message.react('🔒');
  //   });
  // }
  // else if (message.content.startsWith('!maps')) {
  //   // console.log('verificationMessages: ' + verificationMessages.size);
  //   // console.log('tickets: ' + tickets.size);
  //   // console.log('ticketsGamiCard: ' + ticketsGamiCard.size);
  //   // ticketsGamiCard.forEach((gcs, id) => {
  //   //   var gc2 =  (gcs[2] == "Two") ? "gc": "none";
  //   //   console.log(".  " + id + " => [gc, " + gc2 + ", " + gcs[2] +"]");
  //   // });
  //   // console.log('lastAuctioned: ' + lastAuctioned.size);
  //   // console.log('queueImageURL: ' + queueImageURL.size);
  //   // console.log(handlerClaims);
  //   // console.log(queueReacted);
  //   // console.log('-----------------------------');
    
  // }
  // else if (message.content.startsWith('!order')) {
  //   console.log(handlerClaims);
  // }
  // else if (message.content.startsWith('?purgequeue')) {
  //   const queueChan = await client.channels.fetch(QUEUE_CHANNEL_ID);
  //   await queueChan.messages.fetch()
  //   .then(messages => {
  //     for (let [key, value] of messages) {
  //       value.delete();
  //     }
  //   })
  // }

}); 
 

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                    Reactions/ Deletions/ GuildAdds
////////////////////////////////////////////////////////////////////////////////////////////////////////////
client.on('messageReactionAdd', (reaction, user) =>{
  messageReactionAddHandler(reaction, user);
});



client.on('messageDelete', async message => {

  // check to see if we are in queue channel
  if(message.channel.id == QUEUE_CHANNEL_ID){
    handlerClaims.delete(message.id);
    queueImageURL_DELETE(message.id);

    // Pings user that reacted to notification bell in queue channel. Happens when top message is deleted.
    getUserAndDeleteNotifs(message.id).then(async notifs => {

      var waitTime = second; // Start at 1 second
      notifs.forEach(notif => {
        const timeThrottle = new Date( new Date().getTime() + waitTime);
        schedule.scheduleJob(timeThrottle, () => {
          client.users.cache.get(notif.userID).send("### Your auction has started for\n```" + notif.messageContent + "```");
        });
        waitTime += 15*second; // Add 15 seconds
      })
    })
    .then(() => queueReacted.delete(message.id))
    .catch(e => console.log(e));

  }
});



client.on('guildMemberAdd', member => {

  // Give user auction banned role upon joining if they are auction banned
  bans_READ(member.id).then(bl => {
    if (bl) {
      const role = member.guild.roles.cache.find((role) => role.name === aucBannedRoleName);
      if(role){
        member.roles.add(role)
          .then(() => console.log(`Added role ${role.name} to ${member.user.tag}`))
          .catch(console.error);
      }
    }
  })

});



process.on('uncaughtException', (error) => {
  writeToLog(`Uncaught Exception: ${error.stack || error.message}`);
  console.error(`Uncaught Exception: ${error.stack || error.message}`);
  //process.exit(1); // Exit the process to prevent it from continuing with a potentially unstable state. Comment this when pushed into production.
});

process.on('unhandledRejection', (reason, promise) => {
  writeToLog(`Unhandled Promise Rejection: ${reason}`);
  console.error(`Unhandled Promise Rejection: ${reason}`);
});


//client.login(client.config.token);
client.login(TOKEN);


// git init
// git add *
// git commit -m "some title"
// git branch -M main
// git remote add origin https://github.com/drewvcle/DiscBotHeroku.git
// git push -u origin main

//OR
// git add *
// git commit -m "some title"
// git push


//npm i node-schedule
//npm i discord.js @discordjs/rest
//npm i -D nodemon dotenv