import {parseAuctionMsg} from './functions.mjs';
import {time} from 'discord.js';

const day = 86400000;
const COL_OMEGA = 12186367;
const COL_EVENT = 15293728;
const COL_ZETA = 16076006;


export class ChannelOBJ {
    constructor() {
        this.date = 'Done';
        this.status = 'Done';
        this.auctionCountDown = 'Done';
        this.auctionStringArray = '';
    }

    updateDate(date) {
        if (date === 'Done') {
            this.finishAuction();
            return;
        }
        this.date = date;
        this.status = time(date, 'R');
        var timeNow = date.getTime();
        timeNow = timeNow / 1000 - (timeNow % 1000) / 1000;
        this.auctionCountDown = time(timeNow + day / 1000, 'R');
    };

    updateAucStringArray(msg) {
        this.auctionStringArray = parseAuctionMsg(msg);
    };

    finishAuction() {
        this.status = 'Done';
        this.auctionCountDown = 'Done';
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

export class PicSwap {
    constructor(imgURL1, r1 , imgURL2, r2){
        this.pic = 1;
        this.imgURL1 = imgURL1;
        this.rarity1 = r1;
        this.imgURL2 = imgURL2;
        this.rarity2 = r2;
    }
    
    flipPic(){
        this.pic = (this.pic === 2)? 1: 2;
        return (this.pic === 1)? [this.imgURL1, this.rarity1] : [this.imgURL2, this.rarity2];
    }
}

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