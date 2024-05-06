
import { client, AUCTION_VERIFICATION_ID } from '../constants.mjs';
import { EmbedBuilder } from 'discord.js';
import { verificationMessages} from '../objects.mjs';

// Send the ticket to the verification channel
export function sendToVerification(gcs, numChar, userID){
    const aucVerChannel = client.channels.cache.get(AUCTION_VERIFICATION_ID);
  
    // Display date of last ticket 
    // const lastAuc = (lastAuctioned.has(userID)) 
    //   ? lastAuctioned.get(userID).toLocaleDateString("en-US") : "N/A";
  
    const verEmbed = new EmbedBuilder()
        .setTimestamp()
        .addFields(
          {name: ' ', value: 'Item 1: ' + gcs[0].toString()},
          {name: ' ', value: (numChar === "Two")? '\nItem 2: '+ gcs[1].toString() : ' '})
        .setColor(gcs[0].getBorderColor()) 
        /*.setFooter({text: 'Last ticket: ' + lastAuc})*/
        .setThumbnail(gcs[0].imgURL);
  
    aucVerChannel.send({ content: '**Auctioneer**: <@' + userID + '>' , embeds: [verEmbed]})
      .then(message => {
          message.react('✅');
          message.react('❌');
          verificationMessages.set(message, userID);
      });
  }