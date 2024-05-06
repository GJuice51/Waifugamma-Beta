 // Get the value of stat, given a request "start"
export function getInfo(msg, start) {
    var msgCut = msg.substring(msg.indexOf(start));
    var endIdx = msgCut.indexOf("\n");
    endIdx = (endIdx > 0) ? endIdx : 20;
    var msgtemp = msgCut.substring(0, endIdx);
    var info = msgtemp.substring(start.length);
    return [msgCut, info];
}