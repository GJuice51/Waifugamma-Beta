// List of commands
// !timers
// !auction
// !lb
// !ca
// !close
// !addevent
// !deleteevent

import { config } from 'dotenv';
config();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
import schedule from 'node-schedule';

import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType, PermissionsBitField } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping, GuildMessageReactions } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;
//const { userMention, memberNicknameMention, channelMention, roleMention } = require('discord.js');
import { REST } from '@discordjs/rest';
import { channel } from 'node:diagnostics_channel';
import { get } from 'node:http';
import { readFileSync, writeFileSync, promises as fsPromises } from 'fs'; // new
import { updateWin, getTop } from './spreadsheetMJS.mjs';
import { checkLastAuction, saveGlobalID, fileToData, auctionToFile, displayTimers, checkCharacter, getInfo} from './functions.mjs'; // new
import { ChannelOBJ, GamiCard} from './objects.mjs'; // new
import { createAuctionDM, DMConfirmation, FinalConfirmation, createSelectStringMenuAuc } from './auctionDM.mjs';
//import { getDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';
const rest = new REST({ version: '10'}).setToken(TOKEN);

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
const AUCTION_COOLDOWN = 30 * second;//37 * day;
const AUCTION_LENGTH =  15 * second;// day


const GUILD_ID = '1013859678201069568'; 
const TICKET_CAT_ID = '1167881102938091560';
const QUEUE_CHANNEL_ID = '1038245842122977360';
const AUCTION_HANDLING_CHANNEL_ID = '1168753393574088774';
const HANDLER_CHAT_CHANNEL_ID = '1033815697161212055';
const AUCTION_VERIFICATION_ID = '1168698674298245231';
const GJUICE_ID = '230114915413655552';
const AGUA_ID = '238454480385867776';
//const WAIFUKAPPA_ID = '1030655480441348096'; // dont need?
//const HANDLER_ID = '892866809919836172'; // probably doesnt work

var eventOptionsArray = [];
var SELECT_MENU_BUILDER_AUCTIONS = createSelectStringMenuAuc(eventOptionsArray);
var verificationMessages = new Map(); // VerificationMessage -> auctioneerID
var tickets = new Map(); // auctioneerID -> channelID
var ticketsGamiCard = new Map(); // auctioneerID -> [GamiCard, Gamicard, str]
var lastAuctioned = new Map(); // auctioneerID -> Date
var handlingAuctionLimit = new Map(); // handlerID -> count
var queueImageURL = new Map(); // QueueMessage -> [0/1, url, url]



/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                       Useful Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////

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
        {name: 'To get started, please __view__ the card(s) you want to auction.', value: ' '},
        {name: '__Rules__', value: ' '},
        {name: ' ', value: '**1.** You can auction either **1** or **2** cards.'},
        {name: ' ', value: '**2.** You can only auction characters with at least 30 wishlist.'},
        {name: ' ', value: '**3.** You can only auction once a month.'},
        {name: ' ', value: '**4.** You cannot auction the same card more than three times.'},
        {name: ' ', value: '**5.** While waiting in queue after submitting your ticket, **DO NOT** trade your cards away! '},
        {name: ' ', value: 'If there are any problems, DM a handler!'}
      )
      .setFooter({text: "Type `!close` to close the channel. The channel will close in 3 minutes."})
      .setColor(0x4CEB34);
    channel.send({ embeds: [resp2]});


    // Close the channel if inactive
    const closeTime = new Date(new Date().getTime() + 180 * second); 
    schedule.scheduleJob(closeTime, () => {
      // check to see if channel is open
      if(client.guilds.cache.get(GUILD_ID) && guild.channels.cache.has(channel.id)) 
        closeChannel(channel);
    });

  })
  .catch((error) => {
    console.error(error);
  });
  return channel.id;
}

// Close a channel
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

// Send the ticket to the verification channel
function sendToVerification(AUCTION_VERIFICATION_ID, gcs, numChar, userID, channel){
  const aucVerChannel = client.channels.cache.get(AUCTION_VERIFICATION_ID);

  const lastAuc = (lastAuctioned.has(userID)) 
    ? lastAuctioned.get(userID).toLocaleDateString("en-US") : "N/A";
  var embedColour = '';
  if (gcs[0].rarity === 'Ω' || (numChar === "Two" && gcs[1].rarity === 'Ω')){ 
    embedColour = 12186367; // omega 
  } else if (gcs[0].event !== 'none' || (numChar === "Two" && gcs[1].event !== 'none')) {
    embedColour = 15293728;  // event
  } else {
    embedColour = 16076006; // zeta
  }

  const verEmbed = new EmbedBuilder()
      .setTimestamp()
      .addFields(
        {name: ' ', value: '**Auctioneer**: <@' + userID + '>'},
        {name: ' ', value: 'Item 1: ' + gcs[0].toString()},
        {name: ' ', value: (numChar === "Two")? '\nItem 2: '+ gcs[1].toString() : ' '})
      .setColor(embedColour) // 0x7393B3
      .setFooter({text: 'Last ticket: ' + lastAuc})
      .setThumbnail(gcs[0].imgURL);

  aucVerChannel.send({ embeds: [verEmbed]})
    .then(message => {
        message.react('✅');
        message.react('❌');
        verificationMessages.set(message, userID);
    });
    
  // Delete GamiCard and close channel after 5 seconds
  const closeTime = new Date(new Date().getTime() + 5 * second); 
  //const guild = client.guilds.cache.get(GUILD_ID);
  schedule.scheduleJob(closeTime, () => {
    //ticketsGamiCard.delete(userID);
    channel.delete();
    //if(guild.channels.cache.has(channel.id))
      //closeChannel(channel);//////////////////////////
  });
}



/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                              Main
/////////////////////////////////////////////////////////////////////////////////////////////////////
client.on('ready', () => {
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
    channels.get(channelString).updateAucStringArray(message.content) 

    // Configure timers
    const currentTime = new Date();
    channels.get(channelString).updateDate(currentTime) // Get current time
    const endAuctionDate = new Date(currentTime.getTime() + AUCTION_LENGTH); 

    
    auctionToFile(auctionTimesFile, channels, channelIDs); // Save auction to a file
    
    // End the auction after 24h
    const privchannel = client.channels.cache.get(HANDLER_CHAT_CHANNEL_ID); 
    schedule.scheduleJob(endAuctionDate, () => {
      channels.get(channelString).finishAuction();
      message.reply("Waiting...");
      privchannel.send('<@' + message.author.id + '>, <#' + getchannel + '> is done.');
      auctionToFile(auctionTimesFile, channels, channelIDs);
    });

    // Display open channels and timers
  } else if(message.content.startsWith('!timers') && message.channel.id === HANDLER_CHAT_CHANNEL_ID){
    const privchannel = client.channels.cache.get(HANDLER_CHAT_CHANNEL_ID);
    displayTimers(privchannel, channelIDs, channels);
  
    // Display current auctions
  } else if(message.content.startsWith('!auction')){
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
      
    // Display leaderboard of bidder winners
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
       
    //////////////////////////////////////////////////////////////////////////////////////////////
    //                              Auction bot ticket system 
    //////////////////////////////////////////////////////////////////////////////////////////////

  } else if(!message.author.bot && !message.guild && !message.content.startsWith('!ca')){
    message.reply('Hello, this is Waifugami\'s auction manager! Please type `!ca` to create an auction ticket.');
  
  } else if (message.content.startsWith('!ca') && tickets.has(message.author.id)){
    message.reply("You have an active ticket!");

  // } else if (message.content.startsWith('!ca') && lastAuctioned.has(message.author.id) ) { 
  //   try{
  //     const dateToAucAgain = new Date(lastAuctioned.get(message.author.id).getTime() + AUCTION_COOLDOWN);
  //     if (new Date() < dateToAucAgain) 
  //       message.reply("It has not been one month since your last auction! You can auction again on " + dateToAucAgain.toLocaleDateString("en-US") + '.');          
  //   } catch(e) {
  //     console.err(e);
  //     message.reply("Something went wrong... please DM a handler.");
  //   }
    

  } else if(message.content.startsWith('!ca') ){

    try{
      if (lastAuctioned.has(message.author.id)){
        const dateToAucAgain = new Date(lastAuctioned.get(message.author.id).getTime() + AUCTION_COOLDOWN);
        if (new Date() < dateToAucAgain) 
          message.reply("It has not been one month since your last auction! You can auction again on " + dateToAucAgain.toLocaleDateString("en-US") + '.');
        else
          createTicket(message);
      } else
        createTicket(message);
    } catch(e) {
      console.err(e);
      message.reply("Something went wrong... please DM a handler.");
    }

  } else if(message.author.id == '722418701852344391' && message.channel.parent.id === TICKET_CAT_ID) {
    if (checkCharacter(message)) {

      try {
        var cardData = message.embeds[0].data.description;
        var name = message.embeds[0].data.title;
        var userID = ""
        var waifuID = "";
        var rarity = "";
        var globalID = "";
        [cardData, userID] = getInfo(cardData, "Claimed by ");
        [cardData, globalID] = getInfo(cardData, "Global ID: ");
        [cardData, waifuID] = getInfo(cardData, "Waifu ID: ");
        [cardData, rarity] = getInfo(cardData, "Type: ");
        userID = userID.substring(userID.indexOf("@")+1).substring(0, userID.length - 3);
        rarity = rarity.substring(rarity.indexOf("(")+1).substring(0,1);
        const imgURL = message.embeds[0].image.url;
        
        // Step 1: Checks if it's omega or Zeta
        if (checkLastAuction(globalID)){
          message.reply("This card has been auctioned recently!"); 
        } else if(!(rarity === "Ω" || rarity === "ζ")){
          message.reply("Character must be Zeta or Omega!");
          //Step 2a: Checks if the auction has been finalized.
        } else if(tickets.has(userID) && message.channel.id === tickets.get(userID) && (ticketsGamiCard.get(userID)[2] === "Two" || ticketsGamiCard.get(userID)[2] === "One" )){
          message.reply("You have already finalized your auction!");
          //Step 2b: Starts auction process
        } else if (tickets.has(userID) && message.channel.id === tickets.get(userID)){
          saveGlobalID(globalID); 
          // Step 2b continued: Runs if there are no items.
          if(ticketsGamiCard.get(userID)[0] === "None"){
            ticketsGamiCard.get(userID)[0] = new GamiCard(name, waifuID, rarity, "None", imgURL);
            
            var charEvent = await new Promise((resolve, reject) => {
              resolve(createAuctionDM(message, userID, SELECT_MENU_BUILDER_AUCTIONS));
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
            ticketsGamiCard.get(userID)[1] = new GamiCard(name, waifuID, rarity, "None", imgURL);
            var charEvent = await new Promise((resolve, reject) => {
              resolve(createAuctionDM(message, userID, SELECT_MENU_BUILDER_AUCTIONS));
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
        console.error(e);
      }
      
    }
  } else if (message.content.startsWith('!close')) {
    closeChannel(message.channel);
    
  } else if(message.content.startsWith('!clearauctions') && (message.author.id == GJUICE_ID || message.author.id == AGUA_ID)) {  
    for (let i = 0; i<= 8; i++) {
      channels.get(channelIDs[i]).finishAuction();
    }
    auctionToFile(auctionTimesFile, channels, channelIDs);
    message.reply("Auctions have been cleared!");
    
    // Add a new event option.
  } else if(message.content.startsWith('!addevent') && message.channel.id === HANDLER_CHAT_CHANNEL_ID){     
    
    // Read the arguments
    var newEvent = '';
    var emoji = '';
    try {
      const regex = /^[a-zA-Z]+$/; 
      const arrEvent = message.content.replace(/ +/g, ' ').split(' ');     
      emoji = arrEvent[1];

      if (arrEvent.length !== 4 || regex.test( emoji[0] )) 
        throw("Das tuff");
      newEvent = arrEvent[2] + ' ' + arrEvent[3];

    } catch(e) { 
      message.reply("Wrong format `!addoption :emoji: Event Year`");
      return;
    }

    // Add the event
    try{
      const newOption = new StringSelectMenuOptionBuilder()
          .setEmoji(emoji)
          .setLabel(newEvent)
          .setDescription(' ') 
          .setValue(newEvent); 

      eventOptionsArray.push(newOption);
      SELECT_MENU_BUILDER_AUCTIONS = createSelectStringMenuAuc(eventOptionsArray);
      
      message.reply("Added: " + emoji + ' ' + newEvent + '.');
    } catch(e) { 
      console.err(e);
      message.reply("Something went wrong...");
    }

  // Delete an event option.
  } else if(message.content.startsWith('!deleteevent') && (message.author.id == GJUICE_ID || message.author.id == AGUA_ID)){

    // Read the arguments
    var newEvent = '';
    try {
      const arrEvent = message.content.replace(/ +/g, ' ').split(' ');     

      if (arrEvent.length !== 3 ) 
        throw("Das tuff");
      newEvent = arrEvent[1] + ' ' + arrEvent[2];

    } catch(e) { 
      message.reply("Wrong format `!deleteoption Event Year`");
      return;
    }

    // Delete the event
    try{
      const newStringMenuBuilder = new StringSelectMenuBuilder()      
        .setCustomId('event')
        .setPlaceholder('Event');
      
      var deleted = false;
      SELECT_MENU_BUILDER_AUCTIONS.options.forEach((option) => {
        if(option.data.value !== newEvent){ 
          newStringMenuBuilder.addOptions(option);
        } else {
          const index = eventOptionsArray.indexOf(option => option.data.value === newEvent);
          deleted = true;
        }
      });
      SELECT_MENU_BUILDER_AUCTIONS = newStringMenuBuilder;
      message.reply((deleted) ? "Deleted: " + newEvent : "Could not find " + newEvent + ".");
    } catch (e) {
      console.error(e)
      message.reply("Something went wrong...");
    }

    // DELETE LATER, USED FOR TESTING
   } //else if (message.content.startsWith('!embed')) {
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
  
}); 
 


client.on('messageReactionAdd', /*async*/ (reaction, user) =>{
  // Ignore bot reactions
  if ( user.id === client.user.id) {
    return;
  }
  // Handle reactions in verification channel
  if (reaction.message.channel.id === AUCTION_VERIFICATION_ID && verificationMessages.has(reaction.message)) {
   
    try {
      // Accept ticket
      if(reaction.emoji.name === '✅'){ 
        lastAuctioned.set(verificationMessages.get(reaction.message), new Date());  
        

        // Add to queue-channel
        const origEmbed = reaction.message.embeds[0];
        const queueChan = client.channels.cache.get(QUEUE_CHANNEL_ID);
        const newEmbed = new EmbedBuilder()
          .addFields(
            {name: ' ', value: origEmbed.data.fields[1].value},
            {name: ' ', value: origEmbed.data.fields[2].value + ' '}
          )
          .setColor(origEmbed.data.color)
          .setThumbnail(origEmbed.data.thumbnail.url);

        
        queueChan.send( { embeds: [newEmbed]} )
          .then(message => { 
            const gcs = ticketsGamiCard.get(verificationMessages.get(reaction.message));
            if (gcs[2] === "Two") {
              message.react('🔄'); 
              queueImageURL.set(message, [0, gcs[0].imgURL, gcs[1].imgURL]);
            } 
          }) .then(() => {
            var auctioneerID = reaction.message.embeds[0].data.fields[0].value;
            auctioneerID = auctioneerID.substring(auctioneerID.indexOf('@') + 1, auctioneerID.indexOf('>'));
            verificationMessages.delete(reaction.message);
            tickets.delete(auctioneerID);
            ticketsGamiCard.delete(auctioneerID); 
            reaction.message.delete(); 
  
          });
        
        // Add to auction-handling     
        const aucHandlingChan = client.channels.cache.get(AUCTION_HANDLING_CHANNEL_ID);
        origEmbed.data.color = 16711680; // yellow
        aucHandlingChan.send( { embeds: [origEmbed]} )
          .then(message => { message.react('🔒'); });

        
       


        // Decline ticket
      } else if(reaction.emoji.name === '❌'){
        const dmUser = client.users.fetch(verificationMessages.get(reaction.message));
        dmUser.send("Your ticket was denied.")
        .then(() => {
          var auctioneerID = reaction.message.embeds[0].data.fields[0].value;
          auctioneerID = auctioneerID.substring(auctioneerID.indexOf('@') + 1, auctioneerID.indexOf('>'));
          verificationMessages.delete(reaction.message);
          tickets.delete(auctioneerID);
          ticketsGamiCard.delete(auctioneerID); 
          reaction.message.delete(); 

        });
        
          
      } 

      // Delete tickets, cards etc...
      if (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') {
        //console.log(reaction.message.embeds[0].data.fields[0].value);
        
        // var auctioneerID = reaction.message.embeds[0].data.fields[0].value;
        // auctioneerID = auctioneerID.substring(auctioneerID.indexOf('@') + 1, auctioneerID.indexOf('>'));
        // verificationMessages.delete(reaction.message);
        // tickets.delete(auctioneerID);
        // ticketsGamiCard.delete(auctioneerID); 
        // reaction.message.delete(); 
 
      }

    } catch(e){
      console.error(e);
    }
  }

  // Auction Handling Channel: Check for when handler claims auction
  if (reaction.message.channel.id == AUCTION_HANDLING_CHANNEL_ID &&  reaction.emoji.name === '🔒') {
    if(handlingAuctionLimit.has(user.id) && handlingAuctionLimit.get(user.id) == 10){
      const closeMsg = new Date(new Date().getTime() + 5 * second); 
      reaction.message.channel.send("You are handling too many auctions!").then(sentMsg =>{
        schedule.scheduleJob(closeMsg, () => {
          sentMsg.delete();
        });
      });
    }
    else{
      if(!handlingAuctionLimit.has(user.id))
        handlingAuctionLimit.set(user.id, 1);
      else
        handlingAuctionLimit.set(user.id, handlingAuctionLimit.get(user.id) + 1);

      const origEmbed = reaction.message.embeds[0];
      const newEmbed = new EmbedBuilder()
        .addFields(
          {name: ' ', value: origEmbed.data.fields[0].value},
          {name: ' ', value: origEmbed.data.fields[1].value},
          {name: ' ', value: origEmbed.data.fields[2].value + ' '},
          {name: ' ', value: 'Handler: <@' + user.id + '>'}
        )
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({text: origEmbed.data.footer.text});
      reaction.message.edit( { embeds: [newEmbed]} )
        .then(message => {
          message.reactions.removeAll()
          .then(msg => {msg.react('✅'); });
          
      });
    }
    
  }

    // Auction Handling Channel: Check for when handler puts up an auction.
  if (reaction.message.channel.id == AUCTION_HANDLING_CHANNEL_ID &&  reaction.emoji.name === '✅') {
    if(handlingAuctionLimit.get(user.id) == 0){}
    else
    handlingAuctionLimit.set(user.id, handlingAuctionLimit.get(user.id) - 1);

    const origEmbed = reaction.message.embeds[0];
    const newEmbed = new EmbedBuilder()
      .setTitle('__**Completed**__')
      .addFields(
        {name: ' ', value: origEmbed.data.fields[0].value},
        {name: ' ', value: origEmbed.data.fields[1].value},
        {name: ' ', value: origEmbed.data.fields[2].value + ' '},
        {name: ' ', value: '**Handler**: <@' + user.id + '>'}
      )
      .setColor(0x00FF00)
      .setFooter({text: origEmbed.data.footer.text});
    reaction.message.edit( { embeds: [newEmbed]} ) 
      .then(message => {
        message.reactions.removeAll();
      });


  // Flip the picture in queue channel
  }else if(reaction.message.channel.id == QUEUE_CHANNEL_ID && reaction.emoji.name === '🔄'){
    try{

      if(!queueImageURL.has(reaction.message))
        return;

      var imgLinks = queueImageURL.get(reaction.message);
      
      const origEmbed = reaction.message.embeds[0];
      const newEmbed = new EmbedBuilder()
        .addFields(
          {name: ' ', value: origEmbed.data.fields[0].value},
          {name: ' ', value: origEmbed.data.fields[1].value + ' '}
        )
        .setColor(origEmbed.data.color)
        .setThumbnail( (imgLinks[0] === 0)? imgLinks[2] : imgLinks[1]);
      imgLinks[0] = (imgLinks[0] === 0)? 1 : 0;
      
      reaction.message.edit( { embeds: [newEmbed]} )

    }catch(e){
      console.error(e);
    }
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