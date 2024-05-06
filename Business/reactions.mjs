import { verificationMessages, tickets, ticketsGamiCard, handlingAuctionLimit, handlerClaims, queueReacted } from './objects.mjs';
import { client, GUILD_ID, QUEUE_CHANNEL_ID, AUCTION_HANDLING_CHANNEL_ID, AUCTION_VERIFICATION_ID} from './constants.mjs';
import { reloadMessages } from './Functions/FunctionBroker.mjs';
import { EmbedBuilder } from 'discord.js';
import { cardLastAuctioned_INSERT } from '../Persistence/cardLastAuctioned.mjs';
import { lastAuctioned_INSERT } from '../Persistence/lastAuctioned.mjs';
import { queueImageURL_INSERT, flipPic } from '../Persistence/queueImageURL.mjs';
import { insertQueueNotifs } from '../Persistence/queue__notifs_CRUD.mjs';


//export const messageReactionAddHandler = (reaction, user, client) => {
export function messageReactionAddHandler(reaction, user){

  // Ignore bot reactions
  if ( user == null || reaction == null || user.id === client.user.id || reaction.message == null || reaction.message.channel == null) {
    return;
  }

  // Handle reactions in verification channel
  if (reaction.message.channel.id === AUCTION_VERIFICATION_ID && verificationMessages.has(reaction.message)) {
    try {
      const auctioneerID = verificationMessages.get(reaction.message);
      // Accept ticket
      if(reaction.emoji.name === '✅'){  
        //lastAuctioned.set(auctioneerID, new Date());  
        lastAuctioned_INSERT(auctioneerID);
        
        // Add to queue-channel
        const origEmbed = reaction.message.embeds[0];
        const queueChan = client.channels.cache.get(QUEUE_CHANNEL_ID);
        const newEmbed = new EmbedBuilder()
          .addFields( 
            {name: ' ', value: origEmbed.data.fields[0].value},
            {name: ' ', value: origEmbed.data.fields[1].value + ' '}
          )
          .setColor(origEmbed.data.color)
          .setThumbnail(origEmbed.data.thumbnail.url);
        
        queueChan.send( { embeds: [newEmbed]} )
          .then(message => { // With 2-card auctions, allow 🔄 pic swaps
            const gcs = ticketsGamiCard.get(auctioneerID);
            cardLastAuctioned_INSERT(gcs[0].globalID)
            if (gcs[2] === "Two") {
              cardLastAuctioned_INSERT(gcs[1].globalID)
              message.react('🔄'); 

              queueImageURL_INSERT(message.id, gcs)
            } 

            message.react('🔔'); 
            queueReacted.set(message.id, []);
            addToHandling(message.id);
        
          }).then(() => { // Clear from maps
            verificationMessages.delete(reaction.message);
            tickets.delete(auctioneerID);
            ticketsGamiCard.delete(auctioneerID); 
            reaction.message.delete(); 
            client.users.cache.get(auctioneerID).send("Your ticket was accepted!");
          });
        
        // Add to auction-handling   
        function addToHandling(queueID){  
          const aucHandlingChan = client.channels.cache.get(AUCTION_HANDLING_CHANNEL_ID);
          const embedMarker = new EmbedBuilder()
            .addFields( {name: ' ', value: 'https://discord.com/channels/' + GUILD_ID + '/' + QUEUE_CHANNEL_ID + '/' + queueID })
            .setColor(16711680);// red
          return aucHandlingChan.send({ 
            embeds: [embedMarker],
            content: reaction.message.content + '\n' 
              + origEmbed.data.fields[0].value + '\n' + origEmbed.data.fields[1].value,   
            }).then(message => { message.react('🔒'); });
        }


        // Decline ticket
      } else if(reaction.emoji.name === '❌'){
        client.users.cache.get(auctioneerID).send("Your ticket was rejected.")
          .then(() => {
            verificationMessages.delete(reaction.message);
            tickets.delete(auctioneerID);
            ticketsGamiCard.delete(auctioneerID); 
            reaction.message.delete(); 
          });
            
      } 

    } catch(e){
      console.error(e);
    }
  }

  // Auction Handling Channel: Check for when handler claims auction
  if (reaction.message.channel.id == AUCTION_HANDLING_CHANNEL_ID && reaction.emoji.name === '🔒') {
    try{

      // Stop handler from claiming too many auctions
      if(handlingAuctionLimit.has(user.id) && handlingAuctionLimit.get(user.id) == 10){
        const closeMsg = new Date(new Date().getTime() + 5 * second); 
        reaction.message.channel.send("You are handling too many auctions!").then(sentMsg =>{
          schedule.scheduleJob(closeMsg, () => {
            sentMsg.delete();
          });
        });
      
        // Let handler claim auction / display handler  in embed
      } else{ 
        if(!handlingAuctionLimit.has(user.id))
          handlingAuctionLimit.set(user.id, 1);
        else
          handlingAuctionLimit.set(user.id, handlingAuctionLimit.get(user.id) + 1);

        const origEmbed = reaction.message.embeds[0];
        origEmbed.data.color = 0xFFFF00; // yellow
        var newContent = reaction.message.content;
        
        newContent += (reaction.message.content.indexOf("Handler:") == -1) ? ('\nHandler: <@' + user.id + '>') : " ";
        reaction.message.edit( { 
          embeds: [origEmbed],
          content: newContent 
        })
        .then(message => {
          reloadMessages();
          message.reactions.removeAll()
            .then(msg => msg.react('✅') );         
        });

        // Mark queueMessage with handlerID
        var queueMsgID = origEmbed.data.fields[0].value;
        queueMsgID = queueMsgID.substring(queueMsgID.lastIndexOf('/') + 1);
        const QueueChan = client.channels.cache.get(QUEUE_CHANNEL_ID);
        QueueChan.messages.fetch(queueMsgID)
        .then(message => handlerClaims.set(message.id, user.id))
        .catch(console.error);

      }
    } catch(e) {
      console.error(e);
    }
    
  }

    // Auction Handling Channel: Check for when handler puts up an auction.
  if (reaction.message.channel.id == AUCTION_HANDLING_CHANNEL_ID &&  reaction.emoji.name === '✅') {
    try {
      if(handlingAuctionLimit.has(user.id) && handlingAuctionLimit.get(user.id) > 0)
        handlingAuctionLimit.set(user.id, handlingAuctionLimit.get(user.id) - 1);

      const origEmbed = reaction.message.embeds[0];
      origEmbed.data.color = 0x00FF00; // yellow
      reaction.message.edit( { embeds: [origEmbed]} ) 
        .then(message => {
          message.reactions.removeAll();
        });
    } catch(e) {
      console.error(e);
    }


  // Flip the picture in queue channel
  } else if(reaction.message.channel.id == QUEUE_CHANNEL_ID && reaction.emoji.name === '🔄'){

    flipPic(reaction.message.id).then(ps => {
      if (ps){
        const origEmbed = reaction.message.embeds[0];
        const newEmbed = new EmbedBuilder()
          .addFields(
            {name: ' ', value: origEmbed.data.fields[0].value},
            {name: ' ', value: origEmbed.data.fields[1].value + ' '}
          )
          .setColor(ps.borderCol)
          .setThumbnail(ps.imgURL);
    
        reaction.message.edit( { embeds: [newEmbed]} )
      }
    }).catch(e => console.log(e));
    
    // Set a reminder for the reactor for when auction starts
  } else if(reaction.message.channel.id == QUEUE_CHANNEL_ID && reaction.emoji.name === '🔔'  ){

    // let messageContent = "";
    // reaction.message.embeds[0].fields.forEach(f => {
    //   messageContent += f.value + '\n';
    // });

    const items = reaction.message.embeds[0].fields;
    const messageContent = items[0].value  + ( items[1]? '\n'+items[1].value : '' );

    // Check to see if queueID exists
    if (!queueReacted.has(reaction.message.id) ) {
      insertQueueNotifs(reaction.message.id, user.id, messageContent); // Add to database
      queueReacted.set(reaction.message.id, [user.id]); // Add to temp map to prevent SQL DOS
      client.users.cache.get(user.id).send("You will be reminded when the following auction starts```" + messageContent + "```");

    } else if (!queueReacted.get(reaction.message.id).includes(user.id)) {
      insertQueueNotifs(reaction.message.id, user.id, messageContent); // Add to database
      queueReacted.get(reaction.message.id).push(user.id); // Add to temp map to prevent SQL DOS
      client.users.cache.get(user.id).send("You will be reminded when the following auction starts```" + messageContent + "```");
    }

  }
}