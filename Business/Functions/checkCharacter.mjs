  // Check to see if gami message is a viewed card
  export function checkCharacter(message) {
    if (message.embeds.length != 1 && message.embeds.length != 2) {
      return false;
    } else if (message.embeds[0].data.description == null) { // info
      return false;
    } else if (message.embeds[0].data.description.indexOf("Claimed") != 0) { // spawn
      return false;
    }
    return true;
  }