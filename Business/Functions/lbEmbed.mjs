import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} from 'discord.js';
import { updateWin, getTop } from '../spreadsheetMJS.mjs';

export function lbEmbed(s1, s2){
    var e = new EmbedBuilder()
      .setTimestamp()
      .addFields({name: 'Name', value: s1, inline: true})
      .addFields({name: 'Auctions Won', value: s2, inline: true})
      .setColor(0x40C7F4)
      .setTitle('Auction Leaderboards');
    return e;
  }


export function displayLB(message){
  getTop(50).then(async function(board){
    var tens = 10;
    var lbStringIDs = '';
    var lbStringWins = '';
    for(let i = tens - 10; i < tens; i++){
      lbStringIDs += '#' + (i+1) + ': <@' + board.ids[i] + '>\n';
      lbStringWins += board.wins[i] + '\n';
    }
    var embedLB = lbEmbed(lbStringIDs, lbStringWins);

    const left = new ButtonBuilder()
      .setCustomId('left')
      .setLabel('⮜')
      .setStyle(ButtonStyle.Danger);
    const leftDis = new ButtonBuilder()
      .setCustomId('left')
      .setLabel('⮜')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true);
    const right = new ButtonBuilder()
      .setCustomId('right')
      .setLabel('⮞')
      .setStyle(ButtonStyle.Success);
    const rightDis = new ButtonBuilder()
      .setCustomId('right')
      .setLabel('⮞')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(left, right);
      const rowLDis = new ActionRowBuilder().addComponents(leftDis, right);
      const rowRDis = new ActionRowBuilder().addComponents(left, rightDis);
    
      const response = await message.reply({
        embeds: [embedLB],
        //content: 'NEW',
        components: [rowLDis],
      });
      lbStringIDs = '';
      lbStringWins = '';
    

      const collectorFilter = i => i.user.id === message.author.id;

      while(true){
        try {
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
        
        if (confirmation.customId === 'left') {
          tens -= 10;
          for(let i = tens - 10; i < tens; i++){
            lbStringIDs += '#' + (i+1) + ': <@' + board.ids[i] + '>\n';
            lbStringWins += board.wins[i] + '\n';
          }

          embedLB = lbEmbed(lbStringIDs, lbStringWins);
          if(tens == 10)
            await confirmation.update({ embeds: [embedLB], components: [rowLDis] });
          else if(tens > 10 && tens < 50)
            await confirmation.update({ embeds: [embedLB], components: [row] });
          else if (tens == 50)
            await confirmation.update({ embeds: [embedLB], components: [rowRDis] });
          lbStringIDs = '';
          lbStringWins = '';
        } else if (confirmation.customId === 'right') {
          tens += 10;
          for(let i = tens - 10; i < tens; i++){
            lbStringIDs += '#' + (i+1) + ': <@' + board.ids[i] + '>\n';
            lbStringWins += board.wins[i] + '\n';
          }
          embedLB = lbEmbed(lbStringIDs, lbStringWins);
          if(tens == 10)
            await confirmation.update({ embeds: [embedLB], components: [rowLDis] });
          else if(tens > 10 && tens < 50)
            await confirmation.update({ embeds: [embedLB], components: [row] });
          else if (tens == 50)
            await confirmation.update({ embeds: [embedLB], components: [rowRDis] });
          lbStringIDs = '';
          lbStringWins = '';
        }
      
      } catch (e) {
        //await message.reply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        break;
      } 
    }

  });


}