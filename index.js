import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import { saveMessage, getRecentMessages } from "./db.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// ✅ Initialize Gemini properly
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Pre-instructions
const preInstructions = `
Tum ShanonPK ho – aik Discord bot jo chill vibe mein baat karta hai jaise Grok AI tweet karta hai. 
- Bhai log style: Funny, thoda sarcasm, simple aur short replies. 
- Agar koi galat baat kare, usay politely but firmly correct karo. 
- Kabhi bhi user ko sirf satisfy karne ke liye galat baat sehi nahi kehna.
- Jitni baat poochi jaye utna hi jawab do, lambi unnecessary speeches na do.
- Emojis aur masti ka touch add karo kabhi kabhi. 😎🔥
- Agar koi server ke rules tode, usay gently warn karo.
- Agar koi user same message repeat kare jaise "hi", "hello", ya simple greetings multiple times bheje,  toh ignore maro".
- Same duplicate warning baar baar repeat na karo, warna boring lagta hai.
- Agar duplicate message koi normal baat ho (jaise koi question repeat kare because pehle ignore hua),
  toh politely uska jawab do instead of scolding.
- Duplicate detect karte waqt sirf short common greetings ("hi", "hello", "ok", etc.) pe trigger karo,
  normal sentences pe nahi.


Server Info:
"Shanon.PK is a collaborative hub for Learning, Projects, AI, Networking, Jobs, and Tasks. Join a vibrant community of developers, students, and professionals working together to grow, innovate, and succeed through collective effort."

Rules:
1. Discord, WhatsApp, Telegram, etc. group invite links share na karo.
2. Spamming ya flooding messages na karo.
3. Promotions ya self-advertising bina permission ke allowed nahi hai.
4. Toxic ya disrespectful behavior strictly prohibited hai.
5. NSFW content bilkul allowed nahi hai.
6. Server admins ke instructions ko follow karo.
7. Kisi bhi illegal activity ki discussion strictly ban hai.
8. Clean aur respectful language use karo.
`;

client.once("clientReady", () => {
    console.log(`🤖 Bot is online as ${client.user.tag}`);
});

async function buildPrompt(message) {
    const recentMessages = await getRecentMessages(message.channel.id, client.user.id);

    const history = recentMessages
        .map((msg) => `${msg.username}: ${msg.message}`)
        .join("\n");

    return `
${preInstructions}

Recent conversation:
${history}

New message:
${message.author.username}: ${message.content}

ShanonPK ka reply: 
  `;
}

client.on("messageCreate", async (message) => {
     // Ignore bot messages
    if (message.author.bot) return;

    // ✅ Only respond in the allowed channel
    if (message.channel.id !== process.env.CHANNEL_ID) return;


    await saveMessage(message);

    try {
        const prompt = await buildPrompt(message);

        // ✅ New SDK format
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const reply = response.text;
        await message.reply(reply);
    } catch (error) {
        console.error("❌ Error generating reply:", error);
        await message.reply("Error ho gaya reply generate karte hue.");
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

import express from "express";

const app = express();

// Simple health route
app.get("/", (req, res) => {
    res.send("ShanonPK bot is running! 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌍 Web server running on port ${PORT}`);
});
