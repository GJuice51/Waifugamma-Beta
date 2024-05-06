import { EmbedBuilder } from 'discord.js';

export function displayHelp(message) {
    const helpMsg = new EmbedBuilder()
    .setTitle('__WaifuGamma Command List__')
    .setColor(0xADD8E6)
    .setThumbnail('https://cdn.discordapp.com/avatars/1013858480286875760/f87a159daeafa5ef8335f7af89900c7f.webp?size=96')
    .addFields(
        {name: "**Auction Handling**", 
        value: 
            '- `!timers` - displays status of auction channels.\n' + 
            '- `!sethandlerlength <number>` - sets the auction length for handlers.\n' + 
            '- `!resetcooldown <userID>` - resets a user\'s auction cooldown.\n' +
            '- `!syncqueue` - reorders handler pings.'},
        {name: "**Moderation**", 
        value:
            '- `!ban <userID> <reason>` - bans a user from auctioning and bidding.\n'+
            '- `!unban <userID>` - unbans a user.\n'+
            '- `!warn <userID> <reason>` - warns a user.\n'+
            '- `!removewarning <warningID>` - removes a warning.\n' +
            '- `!warnings <userID>` - displays a user\'s ban status and warnings.'},
        {name: "**General**", 
        value:
            '- `!auction` - display current ongoing auctions.\n' +
            '- `!ca` - run ticket system.\n'+
            '- `!lb` - displays leaderboard of bid winners.\n'}
    )
    //.setFooter({text: ' ', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
    //.setImage('https://cdn.discordapp.com/attachments/1033815697161212055/1234546684881534986/tools-background-icon-vector.png?ex=663120b2&is=662fcf32&hm=1c50c83cd27c18b4f0760a804219cc4b1f641defabd33400cc7cf8b13a50eab7&');

    message.reply({embeds: [helpMsg]});

}