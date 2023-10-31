import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;


export async function createAucDMMenu(message, userID){
    try{
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
            .setDescription(' ')
            .setValue('Halloween 2023'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🌴 Summer 2023')
            .setDescription(' ')
            .setValue('Summer 2023'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🌸 Spring 2023')
            .setDescription(' ')
            .setValue('Spring 2023'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🌹 Valentines 2023')
            .setDescription(' ')
            .setValue('Valentines 2023'),
        new StringSelectMenuOptionBuilder()
            .setLabel('❄️ Winter 2022')
            .setDescription(' ')
            .setValue('Winter 2022'),
        new StringSelectMenuOptionBuilder()
            .setLabel('⚰️ Halloween 2022')
            .setDescription(' ')
            .setValue('Halloween 2022'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🥥  Summer 2022')
            .setDescription(' ')
            .setValue('Summer 2022'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🌼  Spring 2022')
            .setDescription(' ')
            .setValue('Spring 2022'),
        new StringSelectMenuOptionBuilder()
            .setLabel('💟  Valentines 2022')
            .setDescription(' ')
            .setValue('Valentines 2022'),
        new StringSelectMenuOptionBuilder()
            .setLabel('☃️  Winter 2021')
            .setDescription(' ')
            .setValue('Winter 2021'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🦇 Halloween 2021')
            .setDescription(' ')
            .setValue('Halloween 2021'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🌞  Summer 2021')
            .setDescription(' ')
            .setValue('Summer 2021'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🥚 Spring 2021')
            .setDescription(' ')
            .setValue('Spring 2021'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🍫  Valentines 2021')
            .setDescription(' ')
            .setValue('Valentines 2021'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🎄 Winter 2020')
            .setDescription(' ')
            .setValue('Winter 2020'),
        new StringSelectMenuOptionBuilder()
            .setLabel('🎃 Halloween 2020')
            .setDescription(' ')
            .setValue('Halloween 2020'),

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
        console.log(e + "\n");
        console.log("createAucDMMenu: Do not worry, channel is deleted before auction could finish.");
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export async function createAuctionDM(message, userID){
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
        //const collectorFilter = i => i.user.id === message.author.id;
        const collectorFilter = i => i.user.id === userID;

        try {
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

            if (dmPress.customId === 'Yes') {
                response.delete();
                
                return new Promise((resolve, reject) => {
                    resolve(createAucDMMenu(message, userID));

                });

                
            } else if (dmPress.customId === 'No') {
                response.delete();
                await message.reply("What made you change your mind? Hmph!");
                return "Cancelled";

                //await response.editReply({ content: 'Please enter the character\'s index number to create an auction.', components: [] });
            }
        } catch (e) {
            if(error instanceof ChannelNotCached){
                console.log(e + "\n");
                console.log("createAuctionDM: Do not worry, channel is deleted before auction could finish.");
            }else{
                response.delete();
                await message.reply("Confirmation not received within 1 minute, cancelling.");
            }
            
            return "Cancelled";
        }

    }catch(e){
        console.log(e + "\n");
        console.log("createAuctionDM: Do not worry, channel is deleted before auction could finish.");
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
        // if(gc.event === "none")
        //     gc.event === "";

        var dmConfirmation = new EmbedBuilder().setTimestamp();
        dmConfirmation.addFields({name: '`Item 1: ' + gc.toString() + ' `\nPlease select an option.', value: " ", inline: true});
        //dmConfirmation.addFields({name: '`Item 1: ' + gc.event + ' [' + gc.rarity + '] ' + gc.name + ' (' + gc.waifuID + ')`\nPlease select an option.', value: " ", inline: true});
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

        //const collectorFilter = i => i.user.id === message.author.id;
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
                return "Zero";

                //await response.editReply({ content: 'Please enter the character\'s index number to create an auction.', components: [] });
            }
        } catch (e) {
            if(error instanceof ChannelNotCached){
                console.log(e + "\n");
                console.log("DMConfirmation: Do not worry, channel is deleted before auction could finish.");
            }else{
                response.delete();
                return "Two";
            }
        }     
        return "Two";
    }catch(e){
        console.log(e + "\n");
        console.log("DMConfirmation: Do not worry, channel is deleted before auction could finish.");
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
        // if(gc2[0].event === "none")
        //     gc2[0].event = "";
        // if(gc2[1].event === "none")
        //     gc2[1].event = "";
        var dmConfirmation = new EmbedBuilder().setTimestamp();
        //dmConfirmation.addFields({name: '`Item 1: ' + gc2[0].event + ' [' + gc2[0].rarity + '] ' + gc2[0].name + ' (' + gc2[0].waifuID + ')`\n' 
         //                       + '`Item 2: ' + gc2[1].event + ' [' + gc2[1].rarity + '] ' + gc2[1].name + ' (' + gc2[1].waifuID + ')`\n'                            
         //                       +'Are you finished with with auction? If so, click Submit.', value: " ", inline: true});

        dmConfirmation.addFields({name: '`Item 1: ' + gc2[0].toString() + '`\n' 
                                + '`Item 2: ' + gc2[1].toString() + '`\n'                            
                                +'Are you finished with with auction? If so, click Submit.', value: " ", inline: true});
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

        //const collectorFilter = i => i.user.id === message.author.id;
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

                //await response.editReply({ content: 'Please enter the character\'s index number to create an auction.', components: [] });
            }
        } catch (e) {
            if(error instanceof ChannelNotCached){
                console.log(e + "\n");
                console.log("FinalConfirmation: Do not worry, channel is deleted before auction could finish.");
            }else{
                response.delete();
                return "Zero";
            }
        }     
        return "Zero";
    }catch(e){
        console.log(e + "\n");
        console.log("FinalConfirmation: Do not worry, channel is deleted before auction could finish.");
    }

}