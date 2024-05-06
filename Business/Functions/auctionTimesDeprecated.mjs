import { readFileSync, writeFileSync } from 'fs'; 
import { day } from '../constants.mjs';

export function fileToData(auctionTimesFile, channels, channelIDs){
  const fileData = readFileSync(auctionTimesFile, 'utf8');
  const breakSections = fileData.split('!@#$%^&*');
  const splitDates = breakSections[0].split('%@%');
  
  const splitAuctionStringArray = breakSections[1].split('$@$');

  for(var i = 0; i < 8; i++){
    var chan = channels.get(channelIDs[i]);

    if(splitDates[i] === "Done"){ 
      chan.date = "Done";
      chan.status = "Done";
    } else {
      chan.updateDate(new Date(splitDates[i]), day);
    }
    chan.auctionStringArray = splitAuctionStringArray[i];
  }
}

export function auctionToFile(auctionTimesFile, channels, channelIDs){
  var dataAsString = "";
  for(var i = 0; i < 8; i++){
    var date = channels.get(channelIDs[i]).date;
    if(date === "Done"){
      if(i == 7)
        dataAsString += "Done";
      else
        dataAsString += "Done%@%";
    }
    else if(i == 7)
      dataAsString += date.toISOString();
    else
      dataAsString += date.toISOString() + "%@%";
  }

  dataAsString += "!@#$%^&*";
  for(var i = 0; i < 8; i++){
    if(i == 7)
      dataAsString += channels.get(channelIDs[i]).auctionStringArray;
    else
      dataAsString += channels.get(channelIDs[i]).auctionStringArray + "$@$";
  }
  writeFileSync(auctionTimesFile, dataAsString);
}