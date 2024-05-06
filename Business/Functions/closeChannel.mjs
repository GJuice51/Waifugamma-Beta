import { TICKET_CAT_ID } from '../constants.mjs'
import { client } from '../constants.mjs';
import { tickets, ticketsGamiCard } from '../objects.mjs';


// Close ticket channel
export function closeChannel(channel){
    if (channel.parent.id != TICKET_CAT_ID) 
      return;
  
    tickets.forEach((chanID, userID) => {
      if (chanID === channel.id){
        const user = client.users.cache.get(userID);
        user.send("Closing ticket...");
        tickets.delete(userID); 
        ticketsGamiCard.delete(userID); 
      }
    }); 
    channel.delete();
  }