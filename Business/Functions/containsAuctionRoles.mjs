import { AUCTION_ROLES } from '../constants.mjs';

// Check to see if str contains auction roles
export function containsAuctionRoles(str){
    for (let i = 0; i <= AUCTION_ROLES.length; i++){
     if (str.includes('<@&' + AUCTION_ROLES[i] + '>'))
         return true;
    }
    return false;
}