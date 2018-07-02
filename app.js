var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

var types = require("./dice-definitions");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);

// set up storage (in memory for now)
var inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);

// Respond
bot.dialog('/', function (session) {
    var msg = session.message.text.toLocaleLowerCase().split(' ');
    if (msg[0] === 'roll') {
        msg.shift(); // drop the command
        var total = { advantage: 0, success: 0, triumph: 0, threat: 0, failure: 0, despair: 0 };
        msg.forEach((dice) => {
            console.log(dice);

            // count of dice
            var count = parseInt(dice);
            count = Math.max(count, 1);
            console.log(count);

            // type of dice
            var type = dice.substring(count.toString().length);
            var typeFound = types.find((t) => {
                return (t.names.includes(type));
            }, this);
            console.log(typeFound.names[0]);

            for (i = 0; i < count; i++) {
                var roll = typeFound.faces[Math.trunc(Math.random() * typeFound.faces.length)];
                console.log(roll);
                total.advantage += roll.advantage;
                total.success += roll.success;
                total.triumph += roll.triumph;
                total.threat += roll.threat;
                total.failure += roll.failure;
                total.despair += roll.despair;
            }
        });
        // summing it up
        var reply = '';
        if (total.triumph > 0)
            reply += 'Triumphs: ' + total.triumph.toString() + '\n';
        if (total.despair > 0)
            reply += 'Despairs: ' + total.despair.toString() + '\n';
        if (total.success > total.failure)
            reply += 'Successes: ' + (total.success - total.failure).toString() + '\n';
        if (total.success < total.failure)
            reply += 'Failures: ' + (total.failure - total.success).toString() + '\n';
        if (total.advantage > total.threat)
            reply += 'Advantages: ' + (total.advantage - total.threat).toString() + '\n';
        if (total.advantage < total.threat)
            reply += 'Threats: ' + (total.threat - total.advantage).toString() + '\n';
        if (reply !== '')
            session.send(reply);
    }
});
