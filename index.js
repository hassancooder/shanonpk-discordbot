require('dotenv').config();
const express = require('express'); // <-- Added
const { Client, GatewayIntentBits } = require('discord.js');

// Load environment variables
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000; // <-- Default port if not provided

// Initialize Express app (for open port)
const app = express();
app.get('/', (req, res) => {
    res.send('Bot is running fine 🚀');
});

// Start dummy HTTP server
app.listen(PORT, () => {
    console.log(`🌍 Dummy server running on http://localhost:${PORT}`);
});

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Required to read message content
    ]
});

// FIX: Changed 'ready' → 'clientReady'
client.once('clientReady', () => {
    console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    try {
        // Ignore bot's own messages
        if (message.author.bot) return;

        // Only listen to a specific channel
        if (message.channel.id === CHANNEL_ID) {
            console.log(`New message received: ${message.content} (ID: ${message.id})`);

            // Send message details to n8n webhook using fetch
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    serverId: message.guild?.id || null,
                    channelId: message.channel.id,
                    messageId: message.id,
                    userId: message.author.id,
                    username: message.author.username,
                    messageText: message.content,
                    timestamp: message.createdTimestamp
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Webhook responded with status ${response.status}: ${errorText}`);
            }

            console.log('✅ Message sent to n8n webhook successfully!');
        }
    } catch (error) {
        console.log('Webhook URL:', WEBHOOK_URL);
        console.error('❌ Error sending message to webhook:', error.message);
    }
});

// Start bot
client.login(TOKEN);
