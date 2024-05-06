import {client, AUCTION_HANDLING_CHANNEL_ID, QUEUE_CHANNEL_ID } from '../constants.mjs';
import { handlerClaims } from '../objects.mjs';


export async function reloadMessages(){
    handlerClaims.clear();
  
    const handlingCH = await client.channels.fetch(AUCTION_HANDLING_CHANNEL_ID);
    const queueChan = await client.channels.fetch(QUEUE_CHANNEL_ID);
    const handlingMessages = await handlingCH.messages.fetch({ limit: 100 });
    await queueChan.messages.fetch({ limit: 100 })
    .then(queueMessages => {
      var tempqueue = [];
      for (let [qid, qmessage] of queueMessages) {
        if (qmessage.embeds.length == 0)
          continue;
        
        var oldMessage = true; // delete this system later?
        for (let [hid, hmessage] of handlingMessages) {
          if (hmessage.embeds.length == 0 || hmessage.embeds[0].data.fields == null)
            continue;
  
          if (hmessage.embeds[0].data.fields[0].value.includes(qid)){
            oldMessage = false;
            const idx = hmessage.content.indexOf("Handler: ");
            if (idx > 0){ // load handler to ping later
              var handlerID = hmessage.content.substring(idx + 11);
              handlerID = handlerID.substring(0, handlerID.length - 1);
              tempqueue.push([qid, handlerID]);
            }
            //break;
          }
        }
  
        // If old message delete later
        if (oldMessage)
          tempqueue.push([qid, null]);
      }
  
      // Add claims in reverse order
      tempqueue.reverse();
      for (let [qid, handlerID] of tempqueue) 
        handlerClaims.set(qid, handlerID);
      
    })
  }