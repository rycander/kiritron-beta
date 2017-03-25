const Discord = require('discord.js');
const schedule = require('node-schedule');
const client = new Discord.Client();

client.login('MjkxNDUwODgwMjc0NzI2OTIz.C7hkMA.hOBTTaqEBkQmlZfW_egKwXwBhH4');

client.on('ready', () => {

});

client.on('message', (message) => {
  let channel = message.channel;
  if(!message.author.bot) {
    channel.sendMessage('Cool story bro.'); 
  }
});

// prep() {
//   let channel = client.channels.find('name', 'general');

// }

