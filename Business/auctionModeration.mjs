import { day, AUCTION_BAN_LENGTH, aucBannedRoleName, handlerRoleName } from './constants.mjs';
import schedule from 'node-schedule';
import { bans_INSERT, bans_DELETE, bans_READ } from '../Persistence/bans_CRUD.mjs';
import { warnings_INSERT, warnings_DELETE, warnings_READ } from '../Persistence/warnings_CRUD.mjs';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, time } from 'discord.js';

// check formatting and return userID, reason, handlerID, member, and date
async function parseMSG(message, argsReq) {
    const args = message.content.replace(/ +/g, ' ').split(' ');     
    const userID = args[1];
    const cmd = args[0];

    // Check formatting
    if ((argsReq == 2 && args.length != 2) ||( argsReq == 3 && args.length < 3) || !(/^\d+$/.test(userID))) {
        let correction = "";
        if (cmd == "!ban"){
            correction = "`!ban userID reason`";
        } else if (cmd == "!unban"){
            correction = "`!unban userID`";
        } else if (cmd == "!warn"){
            correction = "`!warn userID reason`";
        } else if (cmd == "!warnings"){
            correction = "`!warnings userID`";
        } else {
            return -1;
        }
        message.reply("Wrong format: " + correction);
        return -1;
    } 
    const member = await message.guild.members.fetch(userID).catch((error) => {});
    if (!member) {
        message.reply(userID + " is not a userID or not in the server!");  
        return -1;
    }

    // Get the ban length
    let banlen = 6;
    let sliceat = 2;
    if ((/^\d+m$/).test(args[2])){
        banlen = parseInt(args[2].substring(0, args[2].indexOf("m"))) ;
        sliceat = 3;
    }

    // Create a log
    const log = {
        userID: userID,
        reason: args.slice(sliceat).join(' '),
        handlerID: message.author.tag,
        banLength: banlen,
        member: member,
        date: new Date()
    };
    return log;
}



// Auction ban a user 
export async function auctionban(message) {
    
    const log = await parseMSG(message, 3);
    if ( log == -1 )
        return;

    // Give user auction ban role
    const role = message.guild.roles.cache.find((role) => role.name === aucBannedRoleName);
    if (role) {

        // Check if user is already banned
        const hasRole = log.member.roles.cache.has(role.id); 
        if (hasRole) {
            message.reply(log.userID + " is already auction banned.");
            return;
        }

        // Check that handlers cannot be banned
        // const handlerRole = message.guild.roles.cache.find((role) => role.name === handlerRoleName);
        // const isHandler = log.member.roles.cache.has(handlerRole.id);
        // if (handlerRole && isHandler) {
        //     message.reply(log.userID + " cannot be banned!");
        //     return;
        // }

        log.member.roles.add(role)
        .then(() => {
           
            // Save update ban to database
            bans_INSERT(log);

            message.channel.send("User " + log.userID + " banned from auctions for " + log.banLength + "m for: `" + log.reason + '`');
                     
            // Remove ban after x months
            const auctionUnbanDate = new Date(new Date().getTime() + log.banLength * 30 * day);
            schedule.scheduleJob(auctionUnbanDate, () => {
                log.member.roles.remove(role);
                bans_DELETE(log.userID);
            });

        })
        .catch((error) => {
            console.error('Error adding role:', error);
            message.channel.send('Error adding role.');
        });
    }
}

// Auction unban a user
export async function auctionunban(message){

    const log = await parseMSG(message, 2);
    if ( log == -1 )
        return;

    // Remove auction banned role
    const role = message.guild.roles.cache.find((role) => role.name === aucBannedRoleName);
    if (role) {
        // Check if user already banned
        const hasRole = log.member.roles.cache.has(role.id); 
        if (!hasRole) {
            message.reply(log.userID + " is not auction banned.");
            return;
        }

        try {
            //const member = await message.guild.members.fetch(log.userID);
            await log.member.roles.remove(role);


            // TO DO
            // REMOVE ROW FROM DATABASE
            bans_DELETE(log.userID);

            message.channel.send("Unbanned " + log.userID + " from auctions!");
        } catch (error) {
            console.error('Error removing role:', error);
            message.channel.send('Error removing role.');
        }
    }
}

// Warn a user
export async function auctionwarn(message) {

    const log = await parseMSG(message, 3);
    if ( log == -1 )
        return;

    warnings_INSERT(log);
    message.channel.send("Warned " + log.userID + " for: `" + log.reason + '`');
}
 
// Remove a warning from a user
export async function auctionremovewarn(message) {

    const args = message.content.replace(/ +/g, ' ').split(' ');     
    // Check formatting
    if (args.length != 2) {
        message.reply("Wrong format `!removewarning warningID`");
        return;
    } 

    const warningID = args[1];
    warnings_DELETE(warningID)
    .then(() =>  message.reply("Removed warning " + warningID))
    .catch(()=>  message.reply("Could not find warning " + warningID));
   
}

// Display warnings / ban status for a user
export async function displaywarnings(message){

    const log = await parseMSG(message, 2);
    if ( log == -1 )
        return;

    // Create embed of warnings
    const banlog = bans_READ(log.userID);
    const warnlog = warnings_READ(log.userID);
    Promise.all([banlog, warnlog]).then( async logs => { 
        const bl = logs[0];
        const wl = logs[1];
       
        // no warnings = green, warnings = orange, ban = red
        const embedColour = bl? 0xFF0000 : (wl.length > 0)? 0xFFA500 : 0x00FF00;
        const embeddedLog = new EmbedBuilder()
            .setColor(embedColour) 
            .setAuthor({ name: `${wl.length} warnings for ${log.member.user.tag} (${log.member.user.id})`, iconURL: log.member.user.avatarURL() })
            .addFields(
                { name: " " , value: "**Status:**  " + (bl? "Auction banned by " + bl.handlerID : "Not auction banned") , inline: true },
                { name: " ", value: bl? bl.reason + " - " + time( new Date(bl.banDate), 'R') : " "},
                { name: "__________________________", value: " "},
            );
        wl.forEach(w => {
            embeddedLog.addFields({
                name: `Handler: ${w.handlerID}, ID: ${w.warningID} `, 
                value: w.reason + " - " +  time( new Date(w.warnDate), 'R') 
            });
        });
        if (wl.length == 0) {
            embeddedLog.addFields({ name: "No warnings! ", value: " " });
        }

        //message.channel.send({ embeds : [embeddedLog] });

        // Create Delete button
        const deleteButton = new ButtonBuilder()
        .setCustomId('remove')
        .setLabel('🗑️ Remove a warning')
        .setStyle(ButtonStyle.Danger)
        .setDisabled((wl.length > 0)? false : true);
        const row = new ActionRowBuilder().addComponents(deleteButton);

        // Send list of warnings
        const warnings = await message.channel.send({
            embeds : [embeddedLog],
            components: [row]
        });

        
        // Check if delete button is pressed    
        try {
            const collectorFilter = i => i.user.id === message.author.id;
            const warningClick = await warnings.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });
                if (warningClick.customId === 'remove') {
                    // Create warning select menu
                    const warningSelect = new StringSelectMenuBuilder()
                    .setCustomId('warning')
                    .setPlaceholder('Select a warning to remove');
                    wl.forEach(w => {
                        warningSelect.addOptions(new StringSelectMenuOptionBuilder()
                            .setLabel( w.reason )
                            .setDescription(" ")
                            .setValue( w.warningID )
                        );
    
                    });
                    // Removal process embed
                    const removeWarningEmbed = new EmbedBuilder()
                        .setColor(embedColour) 
                        .addFields(
                            { name: `${log.member.user.tag} has ${wl.length} warnings. Select one to remove.` , value: " "}
                        );
    
                    // Confirmation removal button
                    const confirmRemovalButton = new ButtonBuilder()
                    .setCustomId('confirmremoval')
                    .setLabel('Confirm Removal')
                    .setStyle(ButtonStyle.Danger);
                        
                    const ssm = new ActionRowBuilder().addComponents(warningSelect);
                    const cr = new ActionRowBuilder().addComponents(confirmRemovalButton);
                    warnings.edit({
                        embeds : [embeddedLog],
                        components:[]
                    });
                    const selectWarning = await warnings.reply({
                        embeds: [removeWarningEmbed],
                        components: [ssm, cr]
                    });

                    // Check if confirm removal is pressed
                    var selection = "NA";
                    const collectorSelect = selectWarning.createMessageComponentCollector({ time: 180_000 });
                    collectorSelect.on('collect', async (sl) => {
                        if (sl.customId === 'confirmremoval') {
                            if  (selection != "NA" ) {
                                selectWarning.delete();
                                
                                warnings_DELETE(selection)
                                    .then(() => warnings.reply("Removed warning " + selection));
                            }
                        } else if(sl.customId === "warning"){
                            selection = sl.values[0];
                            sl.deferUpdate();                      
                        }
                    });

                }

           

        } catch (e) {
            console.log(e);
        }     

        
    });
    
}