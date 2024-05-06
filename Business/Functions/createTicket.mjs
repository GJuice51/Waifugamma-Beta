
import { client, second, day, GUILD_ID, TICKET_CAT_ID, handlerRoleName, AUCTION_COOLDOWN } from '../constants.mjs';
import { ChannelType, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { GamiCard, tickets, ticketsGamiCard} from '../objects.mjs';
import schedule from 'node-schedule';
import { closeChannel, checkCharacter, getInfo, sendToVerification } from './FunctionBroker.mjs';
import { createAuctionDM, DMConfirmation, FinalConfirmation } from '../auctionDM.mjs';
import { cardLastAuctioned_READ } from '../../Persistence/cardLastAuctioned.mjs';
import { lastAuctioned_READ, lastAuctioned_DELETE } from '../../Persistence/lastAuctioned.mjs';
import { bans_READ } from '../../Persistence/bans_CRUD.mjs';
import { getEventFromGlobalID } from '../../Persistence/WaifugamiDB_CRUD.mjs';

// Create a ticket channel
export function createTicket(message) {
  const guild = client.guilds.cache.get(GUILD_ID);
  const WAIFUGAMI_ID = guild.roles.cache.find(r => r.name === 'Waifugami').id;
  const HANDLER_ID = guild.roles.cache.find(r => r.name === handlerRoleName).id;
  
  // Create channel and give perms
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
      {
        id: HANDLER_ID,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
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
        {name: '__Rules__', value: ' '},
        {name: ' ', value: '**1.** You can auction either **1** or **2** cards.'},
        {name: ' ', value: '**2.** You can only auction characters with at least 30 wishlist.'},
        {name: ' ', value: '**3.** You can only auction once a month.'},
        {name: ' ', value: '**4.** You cannot auction the same card more than three times.'},
        {name: ' ', value: '**5.** While waiting in queue after submitting your ticket, **DO NOT** trade your cards away! '},
        {name: ' ', value: 'If there are any problems, DM a handler!'}
      )
      .setFooter({text: "Type `!close` to close the channel. The channel will self-close in 5 minutes."})
      .setColor(0x4CEB34);
    channel.send({ embeds: [resp2]});

    const resp3 = new EmbedBuilder()
      .addFields({name: 'To get started, please __view__ the card(s) you want to auction.', value: ' '})
      .setColor(0x4CEB34);
    channel.send({ embeds: [resp3]});

    // Close the channel if inactive
    const closeTime = new Date(new Date().getTime() + 300 * second); 
    schedule.scheduleJob(closeTime, () => {
      // check to see if channel is open
      if(client.guilds.cache.get(GUILD_ID) && guild.channels.cache.has(channel.id)) 
        closeChannel(channel);
    });

  })
  .catch((error) => {
    console.error(error);
  });
 // return channel.id;
}

// Create auction ticket in DM
export function createTicketDM(message){
  try{
    if ( tickets.has(message.author.id) ) {
      message.reply("You have an active ticket!");
    
    } else { 
      const auctioneer = lastAuctioned_READ(message.author.id);
      const banlog = bans_READ(message.author.id);

      Promise.all([auctioneer, banlog]).then(arr => {
        const auctr = arr[0];
        const bl = arr[1];

        if (bl){ // user is auction banned
          message.reply(`You are auction banned for the following reasons: \n\`${bl.reason}\` `);
        } else if (!auctr){  // user never auctioned before
          createTicket(message);
        } else {
          var  dateToAucAgain = new Date(new Date(auctr.date).getTime() + AUCTION_COOLDOWN);
          if (new Date() < dateToAucAgain) { // user has auctioned recently
            dateToAucAgain = new Date(dateToAucAgain.getTime() + day);
            message.reply("It hasn't been one month since your last auction! You can auction again on " + dateToAucAgain.toLocaleDateString("en-US") + '.');
          } else
            createTicket(message);
        }
      }).catch(e => console.log(e));
    }


    // } else if (lastAuctioned.has(message.author.id)){
    //     let dateToAucAgain = new Date(lastAuctioned.get(message.author.id).getTime() + AUCTION_COOLDOWN);
    //     if (new Date() < dateToAucAgain) {
    //       dateToAucAgain = new Date(dateToAucAgain.getTime() + day);
    //       message.reply("It hasn't been one month since your last auction! You can auction again on " + dateToAucAgain.toLocaleDateString("en-US") + '.');
    //     } else
    //       createTicket(message);
    // } else
    //     createTicket(message);

  } catch(e) {
    console.error(e);
    message.reply("Something went wrong... please DM a handler.");
  }
}




// export async function ticketHelper(message){
//   if (checkCharacter(message)) {

//     try {
//       var cardData = message.embeds[0].data.description;
//       var name = message.embeds[0].data.title;
//       var userID = ""
//       var waifuID = "";
//       var rarity = "";
//       var globalID = "";
//       [cardData, userID] = getInfo(cardData, "Claimed by ");
//       [cardData, globalID] = getInfo(cardData, "Global ID: ");
//       [cardData, waifuID] = getInfo(cardData, "Waifu ID: ");
//       [cardData, rarity] = getInfo(cardData, "Type: ");
//       userID = userID.substring(userID.indexOf("@")+1).substring(0, userID.length - 3);
//       rarity = rarity.substring(rarity.indexOf("(")+1).substring(0,1);
//       const imgURL = message.embeds[0].image.url;
      
//       // Step 1: Checks if it's Omega or Zeta
//       if (cardNotEligToAuction(globalID)){
//         message.reply("This card has been auctioned recently!"); 
//       } else if(!(rarity === "Ω" || rarity === "ζ")){
//         message.reply("Character must be Zeta or Omega!");
//         //Step 2a: Checks if the auction has been finalized.
//       } else if(tickets.has(userID) && message.channel.id === tickets.get(userID) && (ticketsGamiCard.get(userID)[2] === "Two" || ticketsGamiCard.get(userID)[2] === "One" )){
//         message.reply("You have already finalized your auction!");
//         //Step 2b: Starts auction process
//       } else if (tickets.has(userID) && message.channel.id === tickets.get(userID)){
//         // Step 2b continued: Runs if there are no items.







//           if(typeof ticketsGamiCard.get(userID)[0] === 'string' && ticketsGamiCard.get(userID)[0] === "None"){
//             ticketsGamiCard.get(userID)[0] = new GamiCard(name, waifuID, rarity, "none", imgURL, globalID); //IMPORTANT
            
//             var charEvent = await new Promise((resolve, reject) => {
//               resolve(createAuctionDM(message, userID));
//             }).catch(error => {
//               console.error('Error closing channel: ', error);
//               ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//             });
//             //Step 3a: Cancel.
//             if (charEvent === "Cancelled"){
//               ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//               //ticketsGamiCard.get(userID)
//               //Step 3b. Submit and stores first item.
//             }else{
//               ticketsGamiCard.get(userID)[0].event = charEvent;
//               //Step 4. Asks for confirmation: Submit 1 item, type in the 2nd time, or cancel.
//               ticketsGamiCard.get(userID)[2] = await new Promise((resolve, reject) => {
//                 resolve(DMConfirmation(message, userID, ticketsGamiCard.get(userID)[0] ));
//               }).catch(error => {
//                 console.error('Error closing channel: ', error);
//                 ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//               });

//               if(ticketsGamiCard.get(userID)[2] == "More"){
//                 //Does nothing, and waits for second character.












//               //Step 5b. Starts the queuing process with ONE Item. 
//               }else if(ticketsGamiCard.get(userID)[2] == "One"){
//                 //Starts the queuing process
//                 sendToVerification(ticketsGamiCard.get(userID), "One", userID);
//                 const closeTime = new Date(new Date().getTime() + 5 * second); 
                
//                 try{
//                   schedule.scheduleJob(closeTime, () => {
//                     if(message.channel != null)
//                     message.channel.delete();
//                 });
//                 }catch(error){
//                   console.error("Error closing channel after scheduling job: ", error);
//                 }
              
//               //Step 5c. Cancel.
//               }else{
//                 ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//               }
//             }
            












//           }
//           //Checks if the user viewed a second character before completing the previous application.
//           else if(ticketsGamiCard.get(userID)[2] === "Zero"){ 
//             message.reply("Please complete the previous application!");
//             // Step 2c: Runs if there is 1 item.

//           } else if(globalID === ticketsGamiCard.get(userID)[0].globalID){
//             message.reply("You're currently auctioning this card dummy! :face_with_hand_over_mouth: ");
//           } else{
//             //Check if user tries to view a 3rd card after completing the submission of the first card.
//             if(typeof ticketsGamiCard.get(userID)[1] !== 'string'){
//               message.reply("You can only auction a maximum of two cards! To reset, hit cancel.");
//             }else{
//               ticketsGamiCard.get(userID)[1] = new GamiCard(name, waifuID, rarity, "none", imgURL, globalID);
//               var charEvent = await new Promise((resolve, reject) => {
//                 resolve(createAuctionDM(message, userID));
//               }).catch(error => {
//                 console.error('Error closing channel: ', error);
//                 ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//               });
//               // Step 3a: Cancel.
//               if (charEvent === "Cancelled"){
//                 ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//               // Step 3b: Submit and stores 2nd item.
//               } else {
//                 ticketsGamiCard.get(userID)[1].event = charEvent;
//                 //Step 4. Asks for confirmation.
//                 ticketsGamiCard.get(userID)[2] = await new Promise((resolve, reject) => {
//                   resolve(FinalConfirmation(message, userID, ticketsGamiCard.get(userID)));
//                 }).catch(error => {
//                   console.error('Error closing channel: ', error);
//                   ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//                 });
//                 // Step 5a: Starts queuing process for 2 items.
//                 if(ticketsGamiCard.get(userID)[2] == "Two"){
//                   sendToVerification(ticketsGamiCard.get(userID), "Two", userID);
//                   const closeTime = new Date(new Date().getTime() + 5 * second); 

//                   try{
//                     schedule.scheduleJob(closeTime, () => {
//                       if(message.channel != null)
//                         message.channel.delete();
//                     });
//                   }catch(error){
//                     console.error("Error closing channel after scheduling job: ", error);
//                   }
                  

//                   // Step 5b: Cancel.
//                 }else{
//                   ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
//                 }
//               }
//             }
//           }
//       }
    
//     ////
//     }catch(e){
//       console.error(e);
//     }
    
//   }
// }


export async function ticketHelper(message){
  if (checkCharacter(message)) {

    try {

      //Single View
      if (message.embeds.length == 1){ 

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
        
        // Step 1: Checks if it's Omega or Zeta
        if (await cardNotEligToAuction(globalID)){
          message.reply("This card has been auctioned recently or auctioned 3 times already!"); 
        } else if(!(rarity === "Ω" || rarity === "ζ")){
          message.reply("Character must be Zeta or Omega!");
          //Step 2a: Checks if the auction has been finalized.
        } else if(tickets.has(userID) && message.channel.id === tickets.get(userID) && (ticketsGamiCard.get(userID)[2] === "Two" || ticketsGamiCard.get(userID)[2] === "One" )){
          message.reply("You have already finalized your auction!");
          //Step 2b: Starts auction process
        } else if (tickets.has(userID) && message.channel.id === tickets.get(userID)){
          // Step 2b continued: Runs if there are no items.

            if(typeof ticketsGamiCard.get(userID)[0] === 'string' && ticketsGamiCard.get(userID)[0] === "None"){
              //ticketsGamiCard.get(userID)[0] = new GamiCard(name, waifuID, rarity, "none", imgURL, globalID); 
              //console.log("TEST EVENT: " + await getEventFromGlobalID(globalID));
              ticketsGamiCard.get(userID)[0] = new GamiCard(name, waifuID, rarity, await getEventFromGlobalID(globalID), imgURL, globalID);
              //KINGDATABASE, REPLACE THE NONE WITH THE EVENT ID ^^^^^

              //charEvent CAN EITHER BE CANCELLED, SUBMIT, OR "MORE"
              var charEvent = await new Promise((resolve, reject) => {
                resolve(createAuctionDM(message, userID, ticketsGamiCard.get(userID)[0]));
              }).catch(error => {
                console.error('Error closing channel: ', error);
                ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
              });




              //EITIHER CANCEL OR CONTINUE PROCESS
              //Step 3a: Cancel.
              if (charEvent === "Cancelled"){
                ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
                //ticketsGamiCard.get(userID)

              }else if(charEvent === "More"){
                //Does nothing, and waits for second character.
                ticketsGamiCard.get(userID)[2] = "More";
                //Step 3b. Submit and stores first item.
              }else if(charEvent === "One"){
                //charEvent is "One" because submit is clicked.
                ticketsGamiCard.get(userID)[2] = "One";
                sendToVerification(ticketsGamiCard.get(userID), "One", userID);
                const closeTime = new Date(new Date().getTime() + 5 * second); 
                
                try{
                  schedule.scheduleJob(closeTime, () => {
                    if(message.channel != null)
                    message.channel.delete();
                });
                }catch(error){
                  console.error("Error closing channel after scheduling job: ", error);
                }

              }else{
                //Failsafe, not needed
                ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
              }
              
            


            }
            //ALL OF THIS IS FOR THE 2ND VIEWED CHARACTER

            //Checks if the user viewed a second character before completing the previous application.
            else if(ticketsGamiCard.get(userID)[2] === "Zero"){ 
              message.reply("Please complete the previous application!");
              // Step 2c: Runs if there is 1 item.

            } else if(globalID === ticketsGamiCard.get(userID)[0].globalID){
              message.reply("You're currently auctioning this card dummy! :face_with_hand_over_mouth: ");
            } else{
              //Check if user tries to view a 3rd card after completing the submission of the first card.
              if(typeof ticketsGamiCard.get(userID)[1] !== 'string'){
                message.reply("You can only auction a maximum of two cards! To reset, hit cancel.");
              }else{

                //ticketsGamiCard.get(userID)[1] = new GamiCard(name, waifuID, rarity, "none", imgURL, globalID);
                ticketsGamiCard.get(userID)[0] = new GamiCard(name, waifuID, rarity, await getEventFromGlobalID(globalID), imgURL, globalID); 
                //KINGDATABASE, REPLACE THE NONE WITH THE EVENT ID ^^^^^
                
                var charEvent = await new Promise((resolve, reject) => {
                  //resolve(createAuctionDM(message, userID));
                  resolve(FinalConfirmation(message, userID, ticketsGamiCard.get(userID)));

                }).catch(error => {
                  console.error('Error closing channel: ', error);
                  ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
                });

                


                // Step 3a: Cancel.
                if (charEvent === "Cancelled"){
                  ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
                // Step 3b: Submit and stores 2nd item.
                } else if(charEvent === "Submit"){
                  // charEvent is "Submit"

                  //ticketsGamiCard.get(userID)[1].event = charEvent;
                  //ticketsGamiCard.get(userID)[1].event = KINGSDATABASE(GET IMAGE ID????);
                  //ticketsGamiCard.get(userID)[1].event = "none";
                  ticketsGamiCard.get(userID)[2] = "Two";
                  sendToVerification(ticketsGamiCard.get(userID), "Two", userID);
                  const closeTime = new Date(new Date().getTime() + 5 * second); 

                  try{
                    schedule.scheduleJob(closeTime, () => {
                      if(message.channel != null)
                        message.channel.delete();
                    });
                  }catch(error){
                    console.error("Error closing channel after scheduling job: ", error);
                  }

                }else{
                  //Failsafe, not needed.
                  ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
                }




              }
            }
        }
      }


      //Occurs when multiviewing multiple cards at once.
      if (message.embeds.length == 2){

        var cardData = [], name = [], waifuID = [], rarity = [], globalID = [];
        var userID = "";
        const imgURL = [];
        

        for(var i = 0; i < 2; i++){
          cardData.push(message.embeds[i].data.description);
          name.push(message.embeds[i].data.title);
          
          var info;
          [cardData[i], info] = getInfo(cardData[i], "Claimed by ");
          userID = info.substring(info.indexOf("@")+1).substring(0, info.length - 3);
          //console.log("USERID: " + userID);
          [cardData[i], info] = getInfo(cardData[i], "Global ID: ");
          globalID.push(info);
      
          [cardData[i], info] = getInfo(cardData[i], "Waifu ID: ");
          waifuID.push(info);
      
          [cardData[i], info] = getInfo(cardData[i], "Type: ");
          //rarity.push(info.substring(info.indexOf("(") + 1, info.indexOf("(") + 2)); TRY THIS IF IT DOESNT WORK
          rarity.push(info.substring(info.indexOf("(")+1).substring(0,1));

          imgURL.push(message.embeds[i].image.url);
        }


        //console.log("TEST1:" + name[0] + " " + name[1])
        var readyToSubmit = 0;
        while(readyToSubmit < 2 && readyToSubmit != -1){
          if (await cardNotEligToAuction(globalID[readyToSubmit])){
            message.reply("`" + name[readyToSubmit] + "` has been auctioned recently or auctioned 3 times already!"); 
            readyToSubmit = -1;
          } else if(!(rarity[readyToSubmit] === "Ω" || rarity[readyToSubmit] === "ζ")){
            message.reply("`" + name[readyToSubmit] + "` must be Zeta or Omega!");
            readyToSubmit = -1;
            //Step 2a: Checks if the auction has been finalized.
          } else if(tickets.has(userID) && message.channel.id === tickets.get(userID) && (ticketsGamiCard.get(userID)[2] === "Two" || ticketsGamiCard.get(userID)[2] === "One")){
            message.reply("You have already finalized your auction!");
            //Step 2b: Starts auction process
            readyToSubmit = -1;
          }else if(tickets.has(userID) && message.channel.id === tickets.get(userID) && (ticketsGamiCard.get(userID)[2] === "More")){
            message.reply("You can only auction a maximum of two cards! Characters have been reset.");
            readyToSubmit = -1;
          } else if(globalID[0] === globalID[1]){
            //console.log("TEST1: " + globalID[0] + " " + globalID[1]);
            message.reply("...You're seriously trying to auction the same card twice? :expressionless:");
            readyToSubmit = -1;
          } else if (tickets.has(userID) && message.channel.id === tickets.get(userID)){
            
            //if(typeof ticketsGamiCard.get(userID)[readyToSubmit] === 'string' && ticketsGamiCard.get(userID)[readyToSubmit] === "None"){
            //ticketsGamiCard.get(userID)[readyToSubmit] = new GamiCard(name[readyToSubmit], waifuID[readyToSubmit], rarity[readyToSubmit], "none", imgURL[readyToSubmit], globalID[readyToSubmit]);
            ticketsGamiCard.get(userID)[readyToSubmit] = new GamiCard(name[readyToSubmit], waifuID[readyToSubmit], rarity[readyToSubmit],  await getEventFromGlobalID(globalID[readyToSubmit]), imgURL[readyToSubmit], globalID[readyToSubmit]);
            // ^^^^^^^^KINGDATABASE, REPLACE THE NONE WITH THE EVENT ID

            readyToSubmit++;
          }else{
            console.log("idk how you got here.");
            readyToSubmit = -1;
          }


        }

        if (readyToSubmit == -1){
          ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
        }else if (readyToSubmit == 2){
          var charEvent = await new Promise((resolve, reject) => {
            //resolve(createAuctionDM(message, userID));
            resolve(FinalConfirmation(message, userID, ticketsGamiCard.get(userID)));

          }).catch(error => {
            console.error('Error closing channel: ', error);
            ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
          });
          
          console.log("TEST1: " + charEvent);
          // Step 3a: Cancel.
          if (charEvent === "Cancelled"){
            ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
          // Step 3b: Submit and stores 2nd item.
          } else if (charEvent === "Submit") {
            // charEvent is "Submit"
            ticketsGamiCard.get(userID)[2] = "Two";
            sendToVerification(ticketsGamiCard.get(userID), "Two", userID);
            const closeTime = new Date(new Date().getTime() + 5 * second); 

            try{
              schedule.scheduleJob(closeTime, () => {
                if(message.channel != null)
                  message.channel.delete();
              });
            }catch(error){
              console.error("Error closing channel after scheduling job: ", error);
            }






            
            // Step 5b: Cancel.
          }else{
            //Failsafe, not needed.
            ticketsGamiCard.set(userID, ["None", "None", "Zero"]);
          }

        }

        
      }

    ////
    }catch(e){
      console.error(e);
    }
    
  }
}






// Reset the auction cooldown for a user
export function resetCD(message){
    const args = message.content.replace(/ +/g, ' ').split(' ');
    if (args.length != 2) return;
    const userID = args[1];
    //lastAuctioned.delete(userID);
    lastAuctioned_DELETE(userID);
    message.reply(userID + " can now auction again!");
}

// Check to see if card has been auctioned in the last month or auctioned 3 times in the past
async function cardNotEligToAuction(id) {
  const card = await cardLastAuctioned_READ(id); 
  if (!card) // card never auctioned before
    return false;
  return (new Date() < new Date(new Date(card.date).getTime() + AUCTION_COOLDOWN)) || card.timesAuctioned == 3; 
}




