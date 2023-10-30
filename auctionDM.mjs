import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;


export async function createAucDMMenu(message){

    const eventSelect = new StringSelectMenuBuilder()
    .setCustomId('event')
    .setPlaceholder('Event')
    .addOptions(
    new StringSelectMenuOptionBuilder()
    .setLabel('None')
    .setDescription('x1')
    .setValue('none'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🔪 Halloween 2023')
        .setDescription('x1')
        .setValue('hallo2023'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🌴 Summer 2023')
        .setDescription('x1')
        .setValue('summer2023'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🌸 Spring 2023')
        .setDescription('x1.5')
        .setValue('Spring 2023'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🌹 Valentines 2023')
        .setDescription('x1.75')
        .setValue('Val 2023'),
    new StringSelectMenuOptionBuilder()
        .setLabel('❄️ Winter 2022')
        .setDescription('x1.5')
        .setValue('Winter 2022'),
    new StringSelectMenuOptionBuilder()
        .setLabel('⚰️ Halloween 2022')
        .setDescription('x2.25')
        .setValue('Hallow 2022'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🥥  Summer 2022')
        .setDescription('x2.5')
        .setValue('Summer 2022'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🌼  Spring 2022')
        .setDescription('x3')
        .setValue('Spring 2022'),
    new StringSelectMenuOptionBuilder()
        .setLabel('💟  Valentines 2022')
        .setDescription('x3.25')
        .setValue('Val 2022'),
    new StringSelectMenuOptionBuilder()
        .setLabel('☃️  Winter 2021')
        .setDescription('x3.5')
        .setValue('Winter 2021'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🦇 Halloween 2021')
        .setDescription('x3.75')
        .setValue('Hallow 2021'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🌞  Summer 2021')
        .setDescription('x3.75')
        .setValue('Summer 2021'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🥚 Spring 2021')
        .setDescription('x4.5')
        .setValue('Spring 2021'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🍫  Valentines 2021')
        .setDescription('x4.25')
        .setValue('Val 2021'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🎄 Winter 2020')
        .setDescription('x4.75')
        .setValue('Winter 2020'),
    new StringSelectMenuOptionBuilder()
        .setLabel('🎃 Halloween 2020')
        .setDescription('x5')
        .setValue('Hallow 2020'),

    );
    const row1 = new ActionRowBuilder()
    .addComponents(eventSelect);

    const dmSubmit = new ButtonBuilder()
        .setCustomId('Submit')
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);
    const dmCancel = new ButtonBuilder()
        .setCustomId('Cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);
    
    const dmRow = new ActionRowBuilder().addComponents(dmSubmit, dmCancel);


    const response = await message.reply({
        content: 'Please choose an event. The ticket expires in 60 seconds.',
        components: [row1, dmRow],
    });

    const selection = "NA";
    const collector = response.createMessageComponentCollector({ time: 60_000 });

    return new Promise((resolve, reject) => {
        collector.on('collect', async (i) => {
            if (i.customId === 'Submit') {
                if (selection === "NA" ) {
                    await i.reply(`Please choose an event.`);
                } else {
                    response.delete();
                    resolve(selection);
                }
            } else if (i.customId === 'Cancel') {
                response.delete();
                await i.reply(`What made you change your mind? Hmph!`);
                resolve("Cancelled"); 
            } else if(i.customId === "event"){
                selection = i.values[0];
                i.deferUpdate();
            }
        });

    });


}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function createAuctionDM(message){
    var dmConfirmation = new EmbedBuilder().setTimestamp();
    dmConfirmation.addFields({name: 'Is this the character that you want to auction?', value: " ", inline: true});
    dmConfirmation.setColor(0x40C7F4);
    dmConfirmation.setTitle('Confirmation');
    
    const dmYes = new ButtonBuilder()
    .setCustomId('Yes')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Success);
    const dmNo = new ButtonBuilder()
    .setCustomId('No')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

    const dmRow = new ActionRowBuilder().addComponents(dmYes, dmNo);

    const response = await message.reply({
        embeds: [dmConfirmation],
        components: [dmRow],
    });

    const collectorFilter = i => i.user.id === message.author.id;

    try {
        const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

        if (dmPress.customId === 'Yes') {
            response.delete();
            
            return new Promise((resolve, reject) => {
                resolve(createAucDMMenu(message));

            });

            
        } else if (dmPress.customId === 'No') {
            response.delete();
            await message.reply("What made you change your mind? Hmph!");
            return "Cancelled";

            //await response.editReply({ content: 'Please enter the character\'s index number to create an auction.', components: [] });
        }
    } catch (e) {
        response.delete();
        await message.reply("Confirmation not received within 1 minute, cancelling.");
        
        return "Cancelled";
    }     

}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function DMConfirmation(message){
    var dmConfirmation = new EmbedBuilder().setTimestamp();
    dmConfirmation.addFields({name: 'Are you finished with with auction? Please view another character to add it to the auction, otherwise, click Submit.', value: " ", inline: true});
    dmConfirmation.setColor(0x40C7F4);
    dmConfirmation.setTitle('Confirmation');
    
    const dmYes = new ButtonBuilder()
    .setCustomId('Yes')
    .setLabel('Submit')
    .setStyle(ButtonStyle.Success);
    const dmNo = new ButtonBuilder()
    .setCustomId('No')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

    const dmRow = new ActionRowBuilder().addComponents(dmYes, dmNo);

    const response = await message.reply({
        embeds: [dmConfirmation],
        components: [dmRow],
    });

    const collectorFilter = i => i.user.id === message.author.id;

    try {
        const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

        if (dmPress.customId === 'Yes') {
            response.delete();
            await message.reply("Thank for applying! Please be patient, you will be adde to the queue shortly.");
            return "One";
        } else if (dmPress.customId === 'No') {
            response.delete();
            await message.reply("What made you change your mind? Hmph!");
            return "Zero";

            //await response.editReply({ content: 'Please enter the character\'s index number to create an auction.', components: [] });
        }
    } catch (e) {
        response.delete();
        return "Two";
    }     
    return "Two";

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function FinalConfirmation(message){
    var dmConfirmation = new EmbedBuilder().setTimestamp();
    dmConfirmation.addFields({name: 'Are you finished with with auction? If so, click Submit.', value: " ", inline: true});
    dmConfirmation.setColor(0x40C7F4);
    dmConfirmation.setTitle('Confirmation');
    
    const dmYes = new ButtonBuilder()
    .setCustomId('Yes')
    .setLabel('Submit')
    .setStyle(ButtonStyle.Success);
    const dmNo = new ButtonBuilder()
    .setCustomId('No')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

    const dmRow = new ActionRowBuilder().addComponents(dmYes, dmNo);

    const response = await message.reply({
        embeds: [dmConfirmation],
        components: [dmRow],
    });

    const collectorFilter = i => i.user.id === message.author.id;

    try {
        const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

        if (dmPress.customId === 'Yes') {
            response.delete();
            await message.reply("Thank for applying! Please be patient, you will be adde to the queue shortly.");
            return "Two";
        } else if (dmPress.customId === 'No') {
            response.delete();
            await message.reply("What made you change your mind? Hmph!");
            return "Zero";

            //await response.editReply({ content: 'Please enter the character\'s index number to create an auction.', components: [] });
        }
    } catch (e) {
        response.delete();
        return "Zero";
    }     
    return "Zero";

}