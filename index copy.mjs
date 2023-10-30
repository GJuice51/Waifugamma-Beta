import { config } from 'dotenv';
config();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
import schedule from 'node-schedule';

import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;
//const { userMention, memberNicknameMention, channelMention, roleMention } = require('discord.js');
//const { time } = require('discord.js');
//const wait = require('node:timers/promises').setTimeout;
import { REST } from '@discordjs/rest';
import { channel } from 'node:diagnostics_channel';
import { get } from 'node:http';
import { readFileSync, writeFileSync, promises as fsPromises } from 'fs'; // new
import { updateWin, getTop } from './spreadsheetMJS.mjs';
import {fileToData, auctionToFile, displayTimers } from './functions.mjs'; // new
import { ChannelOBJ } from './channelobj.mjs'; // new
import { createAucDMMenu, createAuctionDM } from './auctionDM.mjs';
const rest = new REST({ version: '10'}).setToken(TOKEN);


function scheduleMessage(){
  const date = new Date (new Date().getTime() + 2000)
  schedule.scheduleJob(date, () => console.log('Scheduled Message!'));
}

function lbEmbed(s1, s2){
  var e = new EmbedBuilder().setTimestamp();
  e.addFields({name: 'Name', value: s1, inline: true});
  e.addFields({name: 'Auctions Won', value: s2, inline: true});
  e.setColor(0x40C7F4);
  e.setTitle('Auction Leaderboards');
  return e;
}
var dmRarityEvent = [];

// Discord stuff
const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping ],
  partials: [User, Message, GuildMember, ThreadMember, Channel],
});

const channelIDs = ['1013859742210342982', '1013859762284265513', '1013859785365524552', '1015016976978018325', '1015016994552164432', '1015017007390933113', '1015017021592834139', '1015017038852390952'];
const createAuctionChannel = "1168303005838364832";
// Construct array of channels
var channels = new Map();
for (let i = 0; i <= 8; i++) {
  channels.set(channelIDs[i], new ChannelOBJ())
}

const auctionTimesFile = "auctionTimes.txt" 

const day = 86400000;
const second = 1000;

var queueArray = [];
var channelMessages = new Array();


//////////////////////////////////////////////////////////////////////////////// v new
const GUILD_ID = '1013859678201069568'; 
const TICKET_CAT_ID = '1167881102938091560';
var tickets = new Map();

function createTicket(message) {
  const guild = client.guilds.cache.get(GUILD_ID);
  
  guild.channels.create({
    name: message.author.tag,
    type: ChannelType.GuildText,
    parent: TICKET_CAT_ID,
  })
  .then((channel) => {
    message.reply("");
    tickets.set(message.author.id, channel.id);
    channel.send("Auction ticket created by <@" + message.author.id + "> (" + message.author.id +").");
  })
  .catch((error) => {
    console.error(error);
  });
}

function chatInTicket(message, channel) {
  channel.send('From <@' + message.author.id + '>: ' + message.content);
}
////////////////////////////////////////////////////////////////////////////////^ new

async function overwriteQueue(queueChannel){
  channelMessages = [];
  queueArray = [];
  channelMessages = await queueChannel.messages.fetch({limit: 100});
  
  channelMessages.forEach(msg => queueArray.push(msg.author.id));
  queueArray.pop();
}

function checkHandlerPing(privchannel, queueChannel, queueArray){
  // GJuice, Adil, Menma
  const handlersToPing = ['238454480385867776', '238454480385867776', '561281757165387777'];
  overwriteQueue(queueChannel);
  
  for (let i = 0; i < handlersToPing.length; i++){
    if(queueArray.length > 3 && queueArray[queueArray.length - 4] === handlersToPing[i])
    privchannel.send('<@' + whoToPing + '>: <#1053420903159054337>');
  }
}


// function displayTimers(privchannel){
//   var str = '';
//   for(let i = 0; i < channelIDs.length; i++)
//     str += '<#' + channelIDs[i] + '>: ' + channels.get(channelIDs[i]).status + '\n';

//   privchannel.send(str);
// }


/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                              Main
/////////////////////////////////////////////////////////////////////////////////////////////////////
client.on('ready', () => {
  
  // Reset queue channel
  const queueChannel = client.channels.cache.get(`1038245842122977360`);
  overwriteQueue(queueChannel);

  // Load past auctions
  fileToData(auctionTimesFile, channels, channelIDs);
  console.log('The bot is ready.');
})


client.on('messageCreate', async message => {

  // Add a new auction
  if(((message.content.includes('<@&1035228549172445214>')) || message.content.includes('<@&892901214046535690>')) && message.content.includes('Auctioneer') && message.content.toLowerCase().includes('item 1')){
    const getchannel = await client.channels.fetch(message.channel.id);
    
    const channelString = '' + getchannel;
    if(!channelIDs.includes(channelString))
      return;
    
    // Get the character names from message
    channels.get(channelString).updateAucStringArray(message.content) // new

    // Configure timers
    const currentTime = new Date();
    channels.get(channelString).updateDate(currentTime) // Get current time
    // const endAuctionDate = new Date(currentTime.getTime() + day); // real
    const endAuctionDate = new Date(currentTime.getTime() + 15 * second); // short to test
    const nearAuctionDate = new Date(currentTime.getTime() + 5 * second); // ping GJuice when queue is near
    
    auctionToFile(auctionTimesFile, channels, channelIDs);
    
    const userping = message.author.id;
    const privchannel = client.channels.cache.get(`1033815697161212055`); 
    const queueChannel = client.channels.cache.get(`1038245842122977360`);

    // Auction is almost ending
    schedule.scheduleJob(nearAuctionDate, () => {
      checkHandlerPing(privchannel, queueChannel, queueArray);
    });

    // AUCTION ENDS
    schedule.scheduleJob(endAuctionDate, () => {
      channels.get(channelString).finishAuction();
      message.reply("Waiting...");
      privchannel.send('<@' + userping + '>, <#' + getchannel + '> is done.');
      auctionToFile(auctionTimesFile, channels, channelIDs);
    });

  } else if(message.content.startsWith('!timers') && await client.channels.fetch(message.channel.id) == "1033815697161212055"){
    const privchannel = client.channels.cache.get(`1033815697161212055`);
    displayTimers(privchannel, channelIDs, channels);
  
  } else if(message.content.startsWith('!auction')){
    const getchannel = await client.channels.fetch(message.channel.id);
  
    var s = '';
    const embedAuction = new EmbedBuilder().setTimestamp();

    for(let i = 0; i < 8; i++){
      //if(status[i] != 'Done'){
      var chan = channels.get(channelIDs[i]);
      if(chan.status !== 'Done'){
        embedAuction.addFields({name: ' > <#' + channelIDs[i] + '>' + ' — ' + chan.auctionCountDown, value: chan.auctionStringArray});
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
      

  } else if(message.content.startsWith('!lb') && await client.channels.fetch(message.channel.id) == "1117994809706152037"){
  const getchannel = await client.channels.fetch(message.channel.id);
  
  getTop(50).then(async function(board){
    var tens = 10;
    var lbStringIDs = '';
    var lbStringWins = '';
    for(let i = tens - 10; i < tens; i++){
      lbStringIDs += '#' + (i+1) + ': <@' + board.ids[i] + '>\n';
      lbStringWins += board.wins[i] + '\n';
    }
    var embedLB = lbEmbed(lbStringIDs, lbStringWins);

    const left = new ButtonBuilder()
      .setCustomId('left')
      .setLabel('<-')
      .setStyle(ButtonStyle.Danger);
    const leftDis = new ButtonBuilder()
      .setCustomId('left')
      .setLabel('<-')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true);
    const right = new ButtonBuilder()
      .setCustomId('right')
      .setLabel('->')
      .setStyle(ButtonStyle.Success);
    const rightDis = new ButtonBuilder()
      .setCustomId('right')
      .setLabel('->')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(left, right);
      const rowLDis = new ActionRowBuilder().addComponents(leftDis, right);
      const rowRDis = new ActionRowBuilder().addComponents(left, rightDis);
    
      const response = await message.reply({
        embeds: [embedLB],
        //content: 'NEW',
        components: [rowLDis],
      });
      lbStringIDs = '';
      lbStringWins = '';
    

      const collectorFilter = i => i.user.id === message.author.id;

      while(true){
        try {
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
        
        if (confirmation.customId === 'left') {
          tens -= 10;
          for(let i = tens - 10; i < tens; i++){
            lbStringIDs += '#' + (i+1) + ': <@' + board.ids[i] + '>\n';
            lbStringWins += board.wins[i] + '\n';
          }
          //await interaction.guild.members.ban(target);
          //await confirmation.update({ content: `${target.username} has been banned for reason: ${reason}`, components: [] });
          embedLB = lbEmbed(lbStringIDs, lbStringWins);
          if(tens == 10)
            await confirmation.update({ embeds: [embedLB], components: [rowLDis] });
          else if(tens > 10 && tens < 50)
            await confirmation.update({ embeds: [embedLB], components: [row] });
          else if (tens == 50)
            await confirmation.update({ embeds: [embedLB], components: [rowRDis] });
          lbStringIDs = '';
          lbStringWins = '';
        } else if (confirmation.customId === 'right') {
          tens += 10;
          for(let i = tens - 10; i < tens; i++){
            lbStringIDs += '#' + (i+1) + ': <@' + board.ids[i] + '>\n';
            lbStringWins += board.wins[i] + '\n';
          }
          embedLB = lbEmbed(lbStringIDs, lbStringWins);
          if(tens == 10)
            await confirmation.update({ embeds: [embedLB], components: [rowLDis] });
          else if(tens > 10 && tens < 50)
            await confirmation.update({ embeds: [embedLB], components: [row] });
          else if (tens == 50)
            await confirmation.update({ embeds: [embedLB], components: [rowRDis] });
          lbStringIDs = '';
          lbStringWins = '';
        }
      
      } catch (e) {
        //await message.reply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        break;
      } 
    }

  });
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

    getchannel.send('' + id1 + ' ' + char1 + ' ' + id2 + ' ' + char2);
    
  } else if(message.content.startsWith('!menu') ){
    dmRarityEvent = await createAuctionDM(message);
    
  } else if(message.content.startsWith('!clearauctions') && (message.author.id == '230114915413655552' || message.author.id == '238454480385867776')) {  
    for (let i = 0; i<= 8; i++) {
      channels.get(channelIDs[i]).finishAuction()
    }
    auctionToFile(auctionTimesFile, channels, channelIDs);
    message.reply("Auctions have been cleared!")
  
    // Auction bot ticket system 
  } else if( !message.author.bot && !message.guild && message.content.startsWith('!createAuction')){  
    // Make a new channel
    if (!tickets.has(message.author.id)) {
      createTicket(message);
      message.reply('Created an auction ticket!');
      
      
    } else {
      // dmRarityEvent = await createAuctionDM(message);
      // if(!(dmRarityEvent[0] === "Cancelled" || dmRarityEvent[1] === "Cancelled")){
      //   const ch = client.channels.cache.get(tickets.get(message.author.id));
      //   ch.send("" + dmRarityEvent[1] + " " + dmRarityEvent[0] + " " + message.content);
      //   //chatInTicket(message, ch);
        
      // }
      const ch = client.channels.cache.get(tickets.get(message.author.id));
      chatInTicket(message, ch);
        
    }

  } else if (message.content.startsWith('!close')) {
    
    // return if not under kappatickets
    if (message.channel.parent.id != TICKET_CAT_ID) 
      return;

    tickets.forEach((chanID, userID) => {
      if (chanID === message.channel.id){
        const user = client.users.cache.get(userID);
        user.send("Closing ticket...");
        tickets.delete(userID); 
      }
    });
    message.channel.delete();
   
  } else if  (message.content.startsWith('!reply')) {

    // return if not under kappatickets
    if (message.channel.parent.id != TICKET_CAT_ID) 
      return;
    
    var str = "Handler: " + message.content.substring(6);
    tickets.forEach((chanID, userID) => {
      if (chanID === message.channel.id) { 
        const user = client.users.cache.get(userID);
        user.send(str);
      }
    });
  } else if(await client.channels.fetch(message.channel.id) == createAuctionChannel && message.content.startsWith('.v')) {



  }


  
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