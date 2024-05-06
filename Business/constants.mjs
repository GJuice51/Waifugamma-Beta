import {Client, GatewayIntentBits, Partials} from 'discord.js';
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping, GuildMessageReactions } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel} = Partials;

export const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, DirectMessageReactions, DirectMessageTyping, GuildMessageReactions ],
  partials: [User, Message, GuildMember, ThreadMember, Channel],
});

export const second = 1000;
export const hour = second*60*60;
export const day = 86400000;
export const AUCTION_COOLDOWN = 30 * day;
export const AUCTION_LENGTH = day;
export const AUCTION_BAN_LENGTH = 180 * day;

export const aucBannedRoleName = 'auction banned';
export const handlerRoleName = 'auction-handler';

export const GUILD_ID = '554463315078938624'; // 554463315078938624
export const TICKET_CAT_ID = '1170163891259576380'; // 1170163891259576380
export const QUEUE_CHANNEL_ID = '892874661594030141'; // 892874661594030141
export const AUCTION_HANDLING_CHANNEL_ID = '892874498968272906'; // 892874498968272906
export const AUCTION_CHAT_ID = '892896818881523712'; // 892896818881523712
export const HANDLER_CHAT_CHANNEL_ID = '892865839374692352'; // 892865839374692352
export const AUCTION_VERIFICATION_ID = '1170164543222186084'; // 1170164543222186084
export const GJUICE_ID = '230114915413655552';
export const AGUA_ID = '238454480385867776';

export const channelIDs = ['979109147289198592', '892888360681631774', '899695733366722610', '892888408282759238', '899695825326841936', '962698128333611068', '1012527001040605194', '1012527044040593428'];
export const AUCTION_ROLES = ['1096842944234934382', '892901214046535690', '892900925071577128', '1096843608696570017'];


