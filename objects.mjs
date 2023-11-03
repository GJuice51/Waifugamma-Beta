import {parseAuctionMsg} from './functions.mjs';
import {time} from 'discord.js';

const day = 86400000;

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
    constructor(name, waifuID, rarity, event, imgURL) {
        this.name = name;
        this.waifuID = waifuID;
        this.rarity = rarity;
        this.event =  event;
        this.imgURL = imgURL;
    }
    
    toString(){
        var evnt = (this.event === "none")? "" : this.event;
        return evnt + ' [' + this.rarity + '] ' + this.name + ' (' + this.waifuID + ')';
    }
};