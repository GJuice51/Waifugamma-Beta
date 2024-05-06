export function displayTimers(privchannel, channelIDs, channels){
    var str = '';
    for(let i = 0; i < channelIDs.length; i++)
      str += '<#' + channelIDs[i] + '>: ' + channels.get(channelIDs[i]).status + '\n';
  
    privchannel.send(str);
  }

  