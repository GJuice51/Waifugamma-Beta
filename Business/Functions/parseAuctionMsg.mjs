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