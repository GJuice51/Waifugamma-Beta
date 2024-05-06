import { ChannelType, time, Client, GatewayIntentBits, Partials, Collection, CommandInteractionOptionResolver, userMention, channelMention, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;
import { client } from './constants.mjs';
import { selectAuctionMenu_INSERT, selectAuctionMenu_DELETE, getAllEvents_READ } from '../Persistence/auction_select_menu.mjs';
//import { eventOptionsArray } from './objects.mjs';

var eventSelect = null;

export function createSelectStringMenuAuc(){    
    eventSelect = new StringSelectMenuBuilder()
    .setCustomId('event')
    .setPlaceholder('Event');
    //pushNewMenuChoices(eventSelect, newOptionsArray);
    
    const eventrecord = getAllEvents_READ().then( er => {
    
        //eventrecord.then( er => {
        //console.log("TEST:" + er[5].emoji);
        //console.log("Test" + er.length);
        eventSelect.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel('None')
            .setDescription(' ')
            .setValue('none')
        );

        for(var i = er.length - 1; i > -1; i--){
            //console.log("NUMBER: " + i);
            eventSelect.addOptions(new StringSelectMenuOptionBuilder()
                .setEmoji(er[i].emoji)
                .setLabel(er[i].event_name)
                .setDescription(' ')
                .setValue(er[i].event_name)
            );
        }

    });

}


async function createAucDMMenu(message, userID){
    try{
        //Initiliaze the select menu if it is not already initialized.
         if (eventSelect == null){
             eventSelect = createSelectStringMenuAuc();
         }

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
            content: 'What event is this card?',
            components: [row1, dmRow],
        });

        var selection = "NA";
        const collector = response.createMessageComponentCollector({ time: 180_000 });

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
        }).catch(error => {
            console.error('Error getting event: ', error);
            response.delete();
            return "Cancelled";
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


// export async function createAuctionDM(message, userID){
//     try{
//         var dmConfirmation = new EmbedBuilder().setTimestamp();
//         dmConfirmation.addFields({name: 'Is this the character that you want to auction?', value: " ", inline: true});
//         dmConfirmation.setColor(0x40C7F4);
//         dmConfirmation.setTitle('Confirmation');
        
//         const dmYes = new ButtonBuilder()
//         .setCustomId('Yes')
//         .setLabel('Yes')
//         .setStyle(ButtonStyle.Success);
//         const dmNo = new ButtonBuilder()
//         .setCustomId('No')
//         .setLabel('Cancel')
//         .setStyle(ButtonStyle.Secondary);

//         const dmRow = new ActionRowBuilder().addComponents(dmYes, dmNo);

//         const response = await message.reply({
//             embeds: [dmConfirmation],
//             components: [dmRow],
//         });
        
//         const collectorFilter = i => i.user.id === userID;

//         try {
//             const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

//             if (dmPress.customId === 'Yes') {
//                 response.delete();
                
//                 return new Promise((resolve, reject) => {
//                     resolve(createAucDMMenu(message, userID));
//                 }).catch(error => {
//                     console.error('Error getting confirmation: ', error);
//                     response.delete();
//                     message.reply("Error: please let <@238454480385867776> know about this error.");
//                     return "Cancelled";
//                 });

                
//             } else if (dmPress.customId === 'No') {
//                 response.delete();
//                 await message.reply("What made you change your mind? Hmph!");
//                 return "Cancelled";
//             }
//         } catch (e) {
//             if(error instanceof ChannelNotCached){
//                 console.error(e + "\n");
//                 console.error("createAuctionDM: Channel is deleted before auction could finish.");
//                 return "Cancelled";
//             }else{
//                 response.delete();
//                 await message.reply("Confirmation not received within 1 minute, cancelling.");
//                 return "Cancelled";
//             }
            
//             return "Cancelled";
//         }

//     }catch(e){
//         console.error(e + "\n");
//         console.error("createAuctionDM: Channel is deleted before auction could finish.");
//     }
// }

export async function createAuctionDM(message, userID, gc){
    try{
        var dmConfirmation = new EmbedBuilder().setTimestamp();
        //dmConfirmation.addFields({name: 'View another character to add to auction. Otherwise, submit.', value: " ", inline: true});
        dmConfirmation.addFields({name: '`Item 1: ' + gc.toString() + ' `\nPlease select an option.', value: " ", inline: true});
        dmConfirmation.setColor(0x40C7F4);
        dmConfirmation.setTitle('Confirmation');
        
        const dmYes = new ButtonBuilder()
        .setCustomId('Submit')
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);
        const dmAddItem = new ButtonBuilder()
        .setCustomId('AddItem')
        .setLabel('Add Item')
        .setStyle(ButtonStyle.Secondary);
        const dmNo = new ButtonBuilder()
        .setCustomId('Cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

        const dmRow = new ActionRowBuilder().addComponents(dmYes, dmAddItem, dmNo);

        const response = await message.reply({
            embeds: [dmConfirmation],
            components: [dmRow],
        });
        
        const collectorFilter = i => i.user.id === userID;

        try {
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

            if (dmPress.customId === 'Submit') {
                response.delete();
                await message.reply("Thank for registering! Please be patient, you will be added to the queue shortly.");
                client.users.cache.get(userID).send("Thank for registering! Please wait for a handler to verify your auction.");
                return "One";
                // return new Promise((resolve, reject) => {
                //     resolve(createAucDMMenu(message, userID));
                // }).catch(error => {
                //     console.error('Error getting confirmation: ', error);
                //     response.delete();
                //     message.reply("Error: please let <@238454480385867776> know about this error.");
                //     return "Cancelled";
                // });
            }else if(dmPress.customId === 'AddItem'){
                response.delete();
                await message.reply("Please view your second character.");
                return "More";

            } else if (dmPress.customId === 'Cancel') {
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
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

            if (dmPress.customId === 'addItem') {
                response.delete();
                await message.reply("Please view your second character.");
                return "More";
            }else if (dmPress.customId === 'Yes') {
                response.delete();
                await message.reply("Thank for registering! Please be patient, you will be added to the queue shortly.");
                client.users.cache.get(userID).send("Thank for registering! Please wait for a handler to verify your auction.");
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


// export async function FinalConfirmation(message, userID, gc2){
//     try{

//         var dmConfirmation = new EmbedBuilder().setTimestamp();
//         dmConfirmation.addFields({name: '`Item 1: ' + gc2[0].toString() + '`\n' 
//                                 + '`Item 2: ' + gc2[1].toString() + '`\n'                            
//                                 +'Submit this ticket?', value: " ", inline: true});
//         dmConfirmation.setColor(0x40C7F4);
//         dmConfirmation.setTitle('Confirmation');
        
//         const dmYes = new ButtonBuilder()
//         .setCustomId('Yes')
//         .setLabel('Submit')
//         .setStyle(ButtonStyle.Success);
//         const dmNo = new ButtonBuilder()
//         .setCustomId('No')
//         .setLabel('Cancel')
//         .setStyle(ButtonStyle.Secondary);

//         const dmRow = new ActionRowBuilder().addComponents(dmYes, dmNo);

//         const response = await message.reply({
//             embeds: [dmConfirmation],
//             components: [dmRow],
//         });

//         const collectorFilter = i => i.user.id === userID;

//         try {
//             const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

//             if (dmPress.customId === 'Yes') {
//                 response.delete();
//                 await message.reply("Thanks for registering! Please be patient, you will be added to the queue shortly.");
//                 return "Two";
//             } else if (dmPress.customId === 'No') {
//                 response.delete();
//                 await message.reply("What made you change your mind? Hmph!");
//                 return "Zero";

//             }
//         } catch (e) {
//             if(error instanceof ChannelNotCached){
//                 console.error(e + "\n");
//                 console.error("FinalConfirmation: Channel is deleted before auction could finish.");
//             }else{
//                 response.delete();
//                 return "Zero";
//             }
//         }     
//         return "Zero";
//     }catch(e){
//         console.error(e + "\n");
//         console.error("FinalConfirmation: Channel is deleted before auction could finish.");
//     }

// }

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
            const dmPress = await response.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

            if (dmPress.customId === 'Yes') {
                response.delete();
                await message.reply("Thanks for registering! Please be patient, you will be added to the queue shortly.");
                client.users.cache.get(userID).send("Thank for registering! Please wait for a handler to verify your auction.");
                return "Submit";
            } else if (dmPress.customId === 'No') {
                response.delete();
                await message.reply("What made you change your mind? Hmph!");
                return "Cancelled";

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function addEvent(message){
        // Private channel: read the arguments to add event into select menu.
        var newEvent = '';
        var emoji = '';
        try {
          const regex = /^[a-zA-Z]+$/; 
          const arrEvent = message.content.replace(/ +/g, ' ').split(' ');     
          emoji = arrEvent[1];
    
          if (arrEvent.length !== 4 || regex.test( emoji[0] )) 
            throw("Das tuff");
          newEvent = arrEvent[2] + ' ' + arrEvent[3];
    
        } catch(e) { 
          message.reply("Wrong format `!addevent :emoji: Event Year`");
          return;
        }
    
        // Private channel: Add the event into select menu.
        try{
            selectAuctionMenu_INSERT(emoji, newEvent).then(() => createSelectStringMenuAuc());

          message.reply("Added: " + emoji + ' ' + newEvent + '.');
        } catch(e) { 
          console.error(e);
          message.reply("Something went wrong...");
        }
}

export function deleteEvent(message){
        // Read the arguments
        var newEvent = '';
        try {
          const arrEvent = message.content.replace(/ +/g, ' ').split(' ');     
    
          if (arrEvent.length !== 3 ) 
            throw("Das tuff");
          newEvent = arrEvent[1] + ' ' + arrEvent[2];
    
        } catch(e) { 
          message.reply("Wrong format `!deleteoption Event Year`");
          return;
        }
    
        // Delete the event
        try{
          
          const newStringMenuBuilder = new StringSelectMenuBuilder()      
            .setCustomId('event')
            .setPlaceholder('Event');
          
          var deleted = false;
          eventSelect.options.forEach((option) => {
            if(option.data.value !== newEvent){ 
              newStringMenuBuilder.addOptions(option);
            } else {
              //const index = eventOptionsArray.indexOf(option => option.data.value === newEvent);
              deleted = true;
              selectAuctionMenu_DELETE(newEvent);
            }
          });
          eventSelect = newStringMenuBuilder;
          message.reply((deleted) ? "Deleted: " + newEvent : "Could not find " + newEvent + ".");
        } catch (e) {
          console.error(e)
          message.reply("Something went wrong...");
        }
}

