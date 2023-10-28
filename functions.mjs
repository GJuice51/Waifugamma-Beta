
import { readFileSync, writeFileSync } from 'fs'; 



export function checkHandlerPing(privchannel, queueChannel, queueArray){
  // GJuice, Adil, Menma
  const handlersToPing = ['238454480385867776', '238454480385867776', '561281757165387777'];
  overwriteQueue(queueChannel);
  
  for (let i = 0; i < handlersToPing.length; i++){
    if(queueArray.length > 3 && queueArray[queueArray.length - 4] === handlersToPing[i])
    privchannel.send('<@' + whoToPing + '>: <#1053420903159054337>');
  }
  // if(queueArray.length > 3 && queueArray[queueArray.length - 4] === whoToPing)
  //   privchannel.send('<@' + whoToPing + '>: <#1053420903159054337>');
  // if(queueArray.length > 3 && queueArray[queueArray.length - 4] === whoToPingAdil)
  //   privchannel.send('<@' + whoToPingAdil + '>: <#1053420903159054337>');
  // if(queueArray.length > 3 && queueArray[queueArray.length - 4] === whoToPingMenma)
  //   privchannel.send('<@' + whoToPingMenma + '>: <#1053420903159054337>');
}

// export function displayTimers(privchannel, channelIDs, status){
//   var str = '';
//   for(let i = 0; i < channelIDs.length; i++)
//     str += '<#' + channelIDs[i] + '>: ' + status[i] + '\n';

//   privchannel.send(str);
// }


export function parseAuctionMsg(auctionMess){
    // Find auction 1 line
    var findAuc = auctionMess.toLowerCase().indexOf("item 1");
    var tempMsg = auctionMess.slice(findAuc);
    var findNL = tempMsg.indexOf("\n");
    var auction1 = tempMsg.slice(0,findNL);
    // Find auction 2 line
    var auction2 = "";
    findAuc = auctionMess.toLowerCase().indexOf("item 2");
    if (findAuc != -1){
      tempMsg = auctionMess.slice(findAuc);
      findNL = tempMsg.indexOf("\n");
      auction2 = tempMsg.slice(0,findNL);
      auction2 = "\n" + auction2;
    }
    auctionMess = auction1 + auction2;
    auctionMess += "\n";
    return auctionMess;
  }

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
        chan.updateDate(new Date(splitDates[i]));
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

  export function displayTimers(privchannel, channelIDs, channels){
    var str = '';
    for(let i = 0; i < channelIDs.length; i++)
      str += '<#' + channelIDs[i] + '>: ' + channels.get(channelIDs[i]).status + '\n';
  
    privchannel.send(str);
  }