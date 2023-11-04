import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;


function pushNewMenuChoices(eventSelect, newOptionsArray){
    eventSelect.addOptions(new StringSelectMenuOptionBuilder()
        .setLabel('None')
        .setDescription(' ')
        .setValue('none')
    );
    for(var i = newOptionsArray.length - 1; i > -1; i--){
        eventSelect.addOptions(newOptionsArray[i]);
    }

}

export function createSelectStringMenuAuc(newOptionsArray){
    var eventSelect = new StringSelectMenuBuilder()
    .setCustomId('event')
    .setPlaceholder('Event');
    pushNewMenuChoices(eventSelect, newOptionsArray);

    eventSelect.addOptions(
    new StringSelectMenuOptionBuilder()
        .setEmoji('🔪')
        .setLabel('Halloween 2023')
        .setDescription(' ')
        .setValue('Halloween 2023'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🌴')
        .setLabel('Summer 2023')
        .setDescription(' ')
        .setValue('Summer 2023'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🌸')
        .setLabel('Spring 2023')
        .setDescription(' ')
        .setValue('Spring 2023'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🌹')
        .setLabel('Valentines 2023')
        .setDescription(' ')
        .setValue('Valentines 2023'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('❄️')
        .setLabel('Winter 2022')
        .setDescription(' ')
        .setValue('Winter 2022'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('⚰️')
        .setLabel('Halloween 2022')
        .setDescription(' ')
        .setValue('Halloween 2022'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🥥')
        .setLabel('Summer 2022')
        .setDescription(' ')
        .setValue('Summer 2022'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🌼')
        .setLabel('Spring 2022')
        .setDescription(' ')
        .setValue('Spring 2022'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('💟')
        .setLabel('Valentines 2022')
        .setDescription(' ')
        .setValue('Valentines 2022'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('☃️')
        .setLabel('Winter 2021')
        .setDescription(' ')
        .setValue('Winter 2021'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🦇')
        .setLabel('Halloween 2021')
        .setDescription(' ')
        .setValue('Halloween 2021'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🌞')
        .setLabel('Summer 2021')
        .setDescription(' ')
        .setValue('Summer 2021'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🥚')
        .setLabel('Spring 2021')
        .setDescription(' ')
        .setValue('Spring 2021'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🍫')
        .setLabel('Valentines 2021')
        .setDescription(' ')
        .setValue('Valentines 2021'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🎄')
        .setLabel('Winter 2020')
        .setDescription(' ')
        .setValue('Winter 2020'),
    new StringSelectMenuOptionBuilder()
        .setEmoji('🎃')
        .setLabel('Halloween 2020')
        .setDescription(' ')
        .setValue('Halloween 2020')

    );
    return eventSelect;
}




async function createAucDMMenu(message, userID, SELECT_MENU_BUILDER_AUCTIONS){
    try{
        var eventSelect = SELECT_MENU_BUILDER_AUCTIONS;
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
            content: 'What event is this card? The ticket expires in 60 seconds.',
            components: [row1, dmRow],
        });

        var selection = "NA";
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

    }catch(e){
        console.error(e + "\n");
        console.error("createAucDMMenu: Channel is deleted before auction could finish.");
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function createAuctionDM(message, userID, SELECT_MENU_BUILDER_AUCTIONS){
    try{
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
        
        const collectorFilter = i => i.user.id === userID;

        try {
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

            if (dmPress.customId === 'Yes') {
                response.delete();
                
                return new Promise((resolve, reject) => {
                    resolve(createAucDMMenu(message, userID, SELECT_MENU_BUILDER_AUCTIONS));

                });

                
            } else if (dmPress.customId === 'No') {
                response.delete();
                await message.reply("What made you change your mind? Hmph!");
                return "Cancelled";
            }
        } catch (e) {
            if(error instanceof ChannelNotCached){
                console.error(e + "\n");
                console.error("createAuctionDM: Channel is deleted before auction could finish.");
                return "Cancelled";
            }else{
                response.delete();
                await message.reply("Confirmation not received within 1 minute, cancelling.");
                return "Cancelled";
            }
            
            return "Cancelled";
        }

    }catch(e){
        console.error(e + "\n");
        console.error("createAuctionDM: Channel is deleted before auction could finish.");
    }
}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function DMConfirmation(message, userID, gc){
    try{


        var dmConfirmation = new EmbedBuilder().setTimestamp();
        dmConfirmation.addFields({name: '`Item 1: ' + gc.toString() + ' `\nPlease select an option.', value: " ", inline: true});
        dmConfirmation.setColor(0x40C7F4);
        dmConfirmation.setTitle('Confirmation');
        
        const dmAddItem = new ButtonBuilder()
        .setCustomId('addItem')
        .setLabel('Add Item')
        .setStyle(ButtonStyle.Secondary);
        const dmYes = new ButtonBuilder()
        .setCustomId('Yes')
        .setLabel('Submit')
        .setStyle(ButtonStyle.Secondary);
        const dmNo = new ButtonBuilder()
        .setCustomId('No')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

        const dmRow = new ActionRowBuilder().addComponents(dmAddItem, dmYes, dmNo);

        const response = await message.reply({
            embeds: [dmConfirmation],
            components: [dmRow],
        });

        const collectorFilter = i => i.user.id === userID;

        try {
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (dmPress.customId === 'addItem') {
                response.delete();
                await message.reply("Please view your second character.");
                return "More";
            }else if (dmPress.customId === 'Yes') {
                response.delete();
                await message.reply("Thank for registering! Please be patient, you will be added to the queue shortly.");
                return "One";
            } else if (dmPress.customId === 'No') {
                response.delete();
                await message.reply("What made you change your mind? Hmph!");
                return "Cancelled";
            }
        } catch (e) {
            if(error instanceof ChannelNotCached){
                console.error(e + "\n");
                console.error("DMConfirmation: Channel is deleted before auction could finish.");
            }else{
                response.delete();
                return "Two";
            }
        }     
        return "Two";
    }catch(e){
        console.error(e + "\n");
        console.error("DMConfirmation: Channel is deleted before auction could finish.");
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function FinalConfirmation(message, userID, gc2){
    try{

        var dmConfirmation = new EmbedBuilder().setTimestamp();
        dmConfirmation.addFields({name: '`Item 1: ' + gc2[0].toString() + '`\n' 
                                + '`Item 2: ' + gc2[1].toString() + '`\n'                            
                                +'Submit this ticket?', value: " ", inline: true});
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

        const collectorFilter = i => i.user.id === userID;

        try {
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (dmPress.customId === 'Yes') {
                response.delete();
                await message.reply("Thanks for registering! Please be patient, you will be added to the queue shortly.");
                return "Two";
            } else if (dmPress.customId === 'No') {
                response.delete();
                await message.reply("What made you change your mind? Hmph!");
                return "Zero";

            }
        } catch (e) {
            if(error instanceof ChannelNotCached){
                console.error(e + "\n");
                console.error("FinalConfirmation: Channel is deleted before auction could finish.");
            }else{
                response.delete();
                return "Zero";
            }
        }     
        return "Zero";
    }catch(e){
        console.error(e + "\n");
        console.error("FinalConfirmation: Channel is deleted before auction could finish.");
    }

}