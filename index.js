import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import { saveMessage, getRecentMessages } from "./db.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ✅ Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ✅ Pre-instructions for Gemini
const preInstructions = `
Tum ShanonPK ho – aik Discord bot jo chill vibe mein baat karta hai jaise Grok AI tweet karta hai. 
- Bhai log style: Funny, thoda sarcasm, simple aur short replies. 
- Kabhi galat info nahi deni, politely correct karna.
- Sirf jitni baat poochi jaye utna hi jawab dena, lambi speeches nahi.
- Kabhi kabhi emojis aur masti add karo 😎🔥
- Agar user same simple greeting ("hi", "hello", "ok") repeat kare, ignore karo.
- Normal duplicate questions ka reply politely dena.

Server Info:
"Shanon.PK is a collaborative hub for Learning, Projects, AI, Networking, Jobs, and Tasks."

Rules:
1. Spam ya group links share mat karo.
2. Toxic behavior ya disrespect strictly prohibited hai.
3. Illegal activities discussion bilkul allowed nahi hai.
`;

// ✅ Build AI prompt
async function buildPrompt(message) {
  const recentMessages = await getRecentMessages(message.channel.id);

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

// ✅ Short greetings list
const SHORT_GREETINGS = ["hi", "hello", "hey", "ok", "yo", "salam"];

client.once("clientReady", () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    // ✅ Only specific channel
    if (message.channel.id !== process.env.CHANNEL_ID) return;

    const msg = message.content.toLowerCase().trim();

    // ✅ Ignore repeated greetings
    if (SHORT_GREETINGS.includes(msg)) {
      const recentMessages = await getRecentMessages(message.channel.id);

      const lastGreeting = recentMessages.find((m) =>
        SHORT_GREETINGS.includes(m.message.toLowerCase().trim())
      );

      if (lastGreeting) {
        console.log("⚠️ Duplicate greeting detected. Ignoring...");
        return; // No reply
      }
    }

    // ✅ Save message
    await saveMessage(message);

    // ✅ Build prompt and generate AI response
    const prompt = await buildPrompt(message);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // ✅ Safely extract text
    const reply = response.output_text?.trim();

    if (!reply) {
      console.error("⚠️ Empty response from Gemini:", response);
      return await message.reply("Sorry, mujhe kuch samajh nahi aya. 🤖");
    }

    await message.reply(reply);
  } catch (error) {
    console.error("❌ Error generating reply:", error);
    if (error.message.includes("Cannot send an empty message")) {
      return await message.reply("Reply empty aaya, Gemini se kuch nahi mila. 🤔");
    }
    await message.reply("Error ho gaya reply generate karte hue.");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

//
// 🌍 Health check server for Render
//
const app = express();
app.get("/", (req, res) => {
  res.send("ShanonPK bot is running! 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Web server running on port ${PORT}`);
});
