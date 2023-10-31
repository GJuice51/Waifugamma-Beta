// List of commands
// !timers
// !auction
// !lb
// !ca
// !close

import { config } from 'dotenv';
config();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
import schedule from 'node-schedule';

import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType, PermissionsBitField } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping, GuildMessageReactions } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;
//const { userMention, memberNicknameMention, channelMention, roleMention } = require('discord.js');
//const { time } = require('discord.js');
//const wait = require('node:timers/promises').setTimeout;
import { REST } from '@discordjs/rest';
import { channel } from 'node:diagnostics_channel';
import { get } from 'node:http';
import { readFileSync, writeFileSync, promises as fsPromises } from 'fs'; // new
import { updateWin, getTop } from './spreadsheetMJS.mjs';
import { fileToData, auctionToFile, displayTimers,checkCharacter, getInfo} from './functions.mjs'; // new
import { ChannelOBJ, GamiCard} from './objects.mjs'; // new
import { createAucDMMenu, createAuctionDM, DMConfirmation, FinalConfirmation } from './auctionDM.mjs';
const rest = new REST({ version: '10'}).setToken(TOKEN);


function scheduleMessage(){
  const date = new Date (new Date().getTime() + 2000)
  schedule.scheduleJob(date, () => console.log('Scheduled Message!'));
}

function lbEmbed(s1, s2){
  var e = new EmbedBuilder()
    .setTimestamp()
    .addFields({name: 'Name', value: s1, inline: true})
    .addFields({name: 'Auctions Won', value: s2, inline: true})
    .setColor(0x40C7F4)
    .setTitle('Auction Leaderboards');
  return e;
}


// Discord stuff
const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping, GuildMessageReactions ],
  partials: [User, Message, GuildMember, ThreadMember, Channel],
});

const channelIDs = ['1013859742210342982', '1013859762284265513', '1013859785365524552', '1015016976978018325', '1015016994552164432', '1015017007390933113', '1015017021592834139', '1015017038852390952'];

// Construct array of channels
var channels = new Map();
for (let i = 0; i <= 8; i++) {
  channels.set(channelIDs[i], new ChannelOBJ())
}

const auctionTimesFile = "auctionTimes.txt" 

const day = 86400000;
const second = 1000;



const AUCTION_VERIFICATION_ID = '1168698674298245231';
const GUILD_ID = '1013859678201069568'; 
const TICKET_CAT_ID = '1167881102938091560';
const QUEUE_CHANNEL_ID = '1038245842122977360';
const AUCTION_HANDLING_CHANNEL_ID = '1168753393574088774';
//const WAIFUKAPPA_ID = '1030655480441348096'; // dont need?
//const HANDLER_ID = '892866809919836172'; // probably doesnt work

var queueArray = [];
var channelMessages = new Array();
var verificationMessages = new Map();
var tickets = new Map();
var ticketsGamiCard = new Map(); // DELETE
var lastAuctioned = new Map();

function createTicket(message) {
  const guild = client.guilds.cache.get(GUILD_ID);
  const WAIFUGAMI_ID = guild.roles.cache.find(r => r.name === 'Waifugami').id;
  // const HANDLER_ID = guild.roles.cache.find(r => r.name === 'auction-handler').id;
  
  guild.channels.create({
    name: message.author.tag,
    type: ChannelType.GuildText,
    parent: TICKET_CAT_ID,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel], 
      },
      {
        id: client.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel], 
      },
      {
        id: WAIFUGAMI_ID,
        allow: [PermissionsBitField.Flags.ViewChannel], 
      },
      // {
      //   id: HANDLER_ID,
      //   allow: [PermissionsBitField.Flags.ViewChannel],
      // },
      {
        id: message.author.id,
        allow: [PermissionsBitField.Flags.ViewChannel], 
      },

    ],
  })
  .then((channel) => {
    tickets.set(message.author.id, channel.id);
    ticketsGamiCard.set(message.author.id, ["None", "None", "Zero"]);

    const resp1 = new EmbedBuilder()
      .setTimestamp()
      .addFields({name: 'Created an auction ticket channel: <#' + channel.id + '>', value: ' '})
      .setColor(0x4CEB34);
    message.reply({ embeds: [resp1]});

    const resp2 = new EmbedBuilder()
      .setTimestamp()
      .setTitle('Auction Ticket')
      .setThumbnail('https://cdn.discordapp.com/attachments/1033815697161212055/1168700893575774239/latest.png?ex=6552b886&is=65404386&hm=39fd388d3b02354183b1d74062e6d1491c649f9de7b6f961dab1f23ef9cb9957&')
      .addFields({name:' ', value: 'Created by <@' + message.author.id + '>'},
        {name: 'To get started, please __view__ the character(s) you want to auction.', value: ' '},
        {name: '__Rules__ ', value: ' '},
        {name: ' ', value: '**1.** Please wait one month after your previous auction to submit another ticket.'},
        {name: ' ', value: '**2.** You cannot auction the same character more than three times. '},
        {name: ' ', value: '**3.** While waiting in queue after submitting your ticket, **DO NOT** trade your characters away! '}
      )
      .setFooter({text: "Type `!close` to close the channel. The channel will close in 3 minutes."})
      .setColor(0x4CEB34);
    channel.send({ embeds: [resp2]});


    // Close the channel if inactive
    const closeTime = new Date(new Date().getTime() + 180 * second); 
    schedule.scheduleJob(closeTime, () => {
      // check to see if channel is open
      if(client.guilds.cache.get(GUILD_ID) && guild.channels.cache.has(channel.id)) 
        //channel.send("!close");
        closeChannel(channel);
    });

  })
  .catch((error) => {
    console.error(error);
  });
  return channel.id;
}

// function chatInTicket(message, channel) {
//   channel.send('From <@' + message.author.id + '>: ' + message.content);
// }


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

 function closeChannel(channel){
  if (channel.parent.id != TICKET_CAT_ID) 
    return;

  tickets.forEach((chanID, userID) => {
    if (chanID === channel.id){
      const user = client.users.cache.get(userID);
      user.send("Closing ticket...");
      tickets.delete(userID); 
    }
  });
  channel.delete();
}
function sendToVerification(AUCTION_VERIFICATION_ID, gcs, numChar, userID, channel){
  const aucVerChannel = client.channels.cache.get(AUCTION_VERIFICATION_ID);

  var chars =  'Auctioneer: <@' + userID + '>\nItem 1: ' + gcs[0].toString();
  chars += (numChar === "Two")? '\nItem 2:'+ gcs[1].toString() : "";

  aucVerChannel.send(chars)
    .then(message => {
        message.react('✅');
        message.react('❌');
        verificationMessages.set(message, userID);
    });
    
  // Deletes GamiCard and closes channel after 5 seconds
  const closeTime = new Date(new Date().getTime() + 5000); 
  const guild = client.guilds.cache.get(GUILD_ID);
  schedule.scheduleJob(closeTime, () => {
    ticketsGamiCard.delete(userID);
    if(guild.channels.cache.has(channel.id))
      closeChannel(channel);
  });
}



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
     
  } else if(message.content.startsWith('!clearauctions') && (message.author.id == '230114915413655552' || message.author.id == '238454480385867776')) {  
    for (let i = 0; i<= 8; i++) {
      channels.get(channelIDs[i]).finishAuction()
    }
    auctionToFile(auctionTimesFile, channels, channelIDs);
    message.reply("Auctions have been cleared!")
  
    //////////////////////////////////////////////////////////////////////////////////////////////
    //                              Auction bot ticket system 
    //////////////////////////////////////////////////////////////////////////////////////////////

  } else if(!message.author.bot && !message.guild && !message.content.startsWith('!ca')){
    message.reply('Hello, this is Waifugami\'s auction manager! Please type `!ca` to create an auction ticket.');
  
  } else if (message.content.startsWith('!ca') && tickets.has(message.author.id)){
    message.reply("You have an active ticket!");

  } else if (message.content.startsWith('!ca') && lastAuctioned.has(message.author.id) && (new Date() < new Date(lastAuctioned.get(message.author.id).getTime() + 37 * day))) {
    message.reply("It has not been one month since your last auction!");

  } else if(message.content.startsWith('!ca') ){
    createTicket(message);

  } else if(message.author.id == '722418701852344391' && message.channel.parent.id === TICKET_CAT_ID) {
    if (checkCharacter(message)) {
      
      var cardData = message.embeds[0].data.description;
      var name = message.embeds[0].data.title;
      var userID = ""
      var waifuID = "";
      var rarity = "";
      [cardData, userID] = getInfo(cardData, "Claimed by ");
      [cardData, waifuID] = getInfo(cardData, "Waifu ID: ");
      [cardData, rarity] = getInfo(cardData, "Type: ");
      userID = userID.substring(userID.indexOf("@")+1).substring(0, userID.length - 3);
      rarity = rarity.substring(rarity.indexOf("(")+1).substring(0,1);
      // Step 1: Checks if it's omega or Zeta


      try{

    

        if(!(rarity === "Ω" || rarity === "ζ")){
          message.reply("Character must be Zeta or Omega!");
          //Step 2a: Checks if the auction has been finalized.
        } else if(tickets.has(userID) && message.channel.id === tickets.get(userID) && (ticketsGamiCard.get(userID)[2] === "Two" || ticketsGamiCard.get(userID)[2] === "One" )){
          message.reply("You have already finalized your auction!");
          //Step 2b: Starts auction process
        } else if (tickets.has(userID) && message.channel.id === tickets.get(userID)){
          // Step 2b continued: Runs if there are no items.
          if(ticketsGamiCard.get(userID)[0] === "None"){
            ticketsGamiCard.get(userID)[0] = new GamiCard(name, waifuID, rarity, "None");
            

            var charEvent = await new Promise((resolve, reject) => {
              resolve(createAuctionDM(message, userID));
            });
            //Step 3a: Cancel.
            if (charEvent === "Cancelled"){
              ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
              //Step 3b. Submit and stores first item.
            }else{
              ticketsGamiCard.get(userID)[0].event = charEvent;
              //Step 4. Asks for confirmation: Submit 1 item, type in the 2nd time, or cancel.
              ticketsGamiCard.get(userID)[2] = await new Promise((resolve, reject) => {
                resolve(DMConfirmation(message, userID, ticketsGamiCard.get(userID)[0] ));
              });

              if(ticketsGamiCard.get(userID)[2] == "More"){
                //Does nothing, and waits for second character.

               //Step 5b. Starts the queuing process with ONE Item. 
              }else if(ticketsGamiCard.get(userID)[2] == "One"){
                //Starts the queuing process
                sendToVerification(AUCTION_VERIFICATION_ID, ticketsGamiCard.get(userID), "One", userID, message.channel);
              //Step 5c. Cancel.
              }else{
                ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
              }
            }
            // Step 2c: Runs if there is 1 item.
          }else{
            ticketsGamiCard.get(userID)[1] = new GamiCard(name, waifuID, rarity, "None");
            var charEvent = await new Promise((resolve, reject) => {
              resolve(createAuctionDM(message, userID));
            });
            // Step 3a: Cancel.
            if (charEvent === "Cancelled"){
              ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
            // Step 3b: Submit and stores 2nd item.
            } else {
              ticketsGamiCard.get(userID)[1].event = charEvent;
              //Step 4. Asks for confirmation.
              ticketsGamiCard.get(userID)[2] = await new Promise((resolve, reject) => {
                resolve(FinalConfirmation(message, userID, ticketsGamiCard.get(userID)));
              });
              // Step 5a: Starts queuing process for 2 items.
              if(ticketsGamiCard.get(userID)[2] == "Two"){
                sendToVerification(AUCTION_VERIFICATION_ID, ticketsGamiCard.get(userID), "Two", userID, message.channel);
                // Step 5b: Cancel.
              }else{
                ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
              }
            }
          }
        }
      
      ////
      }catch(e){
        console.log(e);
        console.error("Main Auction Bot: Do not worry, channel is deleted before auction could finish.")
      }
      
    }
  } else if (message.content.startsWith('!close')) {
    closeChannel(message.channel);
  }
  
}); 
 


client.on('messageReactionAdd', async (reaction, user) =>{

  if (reaction.message.channel.id !== AUCTION_VERIFICATION_ID || !verificationMessages.has(reaction.message) || user.id === client.user.id)
    return;

  try {
    if(reaction.emoji.name === '✅'){
      lastAuctioned.set(verificationMessages.get(reaction.message), new Date());  
      await reaction.message.delete();
      verificationMessages.delete(reaction.message);  

      const queueChan = client.channels.cache.get(QUEUE_CHANNEL_ID);
      var str = reaction.message.content;
      str = str.substring(str.indexOf('\n')+1);
      queueChan.send(str);
      
      const aucHandling = client.channels.cache.get(AUCTION_HANDLING_CHANNEL_ID);
      aucHandling.send(reaction.message.content);


    } else if(reaction.emoji.name === '❌'){
      const dmUser = await client.users.fetch(verificationMessages.get(reaction.message));
      await dmUser.send("Your ticket was denied.");
      await reaction.message.delete();
      verificationMessages.delete(reaction.message);
        
    } 
  } catch(e){
    console.error( "damn...: " + e);
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