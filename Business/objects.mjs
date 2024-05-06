import { parseAuctionMsg } from './Functions/parseAuctionMsg.mjs';
import { time } from 'discord.js';
import { day } from './constants.mjs';

const COL_OMEGA = 12186367;
const COL_EVENT = 15293728;
const COL_ZETA = 16076006;


export class ChannelOBJ {
    constructor() {
        this.date = 'Done';
        this.status = 'Done';
        this.auctionCountDown = 'Done';
        this.auctionCDISOString = 'Done';
        this.auctionStringArray = '';
    }

    updateDate(date, auclen=day) {
        if (date === 'Done' || new Date() - date > day) {
            this.finishAuction();
            return;
        }
        this.date = date;
        this.status = time(date, 'R');
        var timeNow = date.getTime();
        timeNow = timeNow / 1000 - (timeNow % 1000) / 1000;
        this.auctionCountDown = time(timeNow + auclen / 1000, 'R');
        this.auctionCDISOString = new Date(date.getTime() + auclen).toISOString();
    };

    updateAucStringArray(msg) {
        this.auctionStringArray = parseAuctionMsg(msg);
    };

    finishAuction() {
        this.status = 'Done';
        this.auctionCountDown = 'Done';
        this.auctionCDISOString = 'Done';
        this.date = 'Done';
    };

};

export class GamiCard {
    constructor(name, waifuID, rarity, event, imgURL, globalID) {
        this.name = name;
        this.waifuID = waifuID;
        this.rarity = rarity;
        this.event =  event;
        this.imgURL = imgURL;
        this.globalID = globalID;
    }
    
    toString(){
        var evnt = (this.event === "none")? "" : this.event;
        return evnt + ' [' + this.rarity + '] ' + this.name + ' (' + this.waifuID + ')';
    }

    getBorderColor(){
        return (this.rarity === 'Ω') ? COL_OMEGA : ((this.event !== 'none') ? COL_EVENT: COL_ZETA);
    }
};

// export class PicSwap {
//     constructor(imgURL1, r1 , imgURL2, r2){
//         this.pic = 1;
//         this.imgURL1 = imgURL1;
//         this.rarity1 = r1;
//         this.imgURL2 = imgURL2;
//         this.rarity2 = r2;
//     }
    
//     flipPic(){
//         this.pic = (this.pic === 2)? 1: 2;
//         return (this.pic === 1)? [this.imgURL1, this.rarity1] : [this.imgURL2, this.rarity2];
//     }
// }

export class LimitedMap {
    
    constructor(limit){
        this.m = new Map();
        this.size = 0;
        this.limit = limit;
    }

    set(a,b){
        if (this.m.size >= this.limit)
            this.m.delete(this.m.keys().next().value);
        this.m.set(a,b);
        this.size = this.m.size;
    }
    get(a){
        return this.m.get(a);
    }
    has(a){
        return this.m.has(a);
    }
    delete(a){
        this.m.delete(a);
    }
    clear(){
        this.m.clear();
    }
    top(max = 1){ 
        var handlings = [];
        var count = 0;
        for (let [queueMsgID, handlerID] of this.m) {
            handlings.push([queueMsgID, handlerID]);
            count += 1;
            if (count == max)
                break;
        }
        if (handlings.length == 0)
            handlings.push([null, null]);
        return handlings;
    }
}

// Maps
//export var eventOptionsArray = [];
//export var SELECT_MENU_BUILDER_AUCTIONS = createSelectStringMenuAuc(eventOptionsArray); //MOVED TO SQL
export var verificationMessages = new Map(); // VerificationMessage -> auctioneerID
export var tickets = new Map(); // auctioneerID -> channelID
export var ticketsGamiCard = new Map(); // auctioneerID -> [GamiCard, Gamicard, str]
//export var lastAuctioned = new Map(); // auctioneerID -> Date                   // MOVED TO SQL
export var handlingAuctionLimit = new Map(); // handlerID -> count
//export var queueImageURL = new LimitedMap(100); // QueueMessage -> PicSwap       // MOVED TO SQL
export var handlerClaims = new LimitedMap(100); // queueMessageID -> handlerID   
//export var cardLastAuctioned = new Map(); //globalID -> DATE                    // MOVED TO SQL
                                        // Make this -> [DATE, # times auctioned] 
export var queueReacted = new Map(); // queueMessageID -> array of IDs