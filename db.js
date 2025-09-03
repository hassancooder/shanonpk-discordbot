// db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const db = await open({
  filename: "./chat_memory.db",
  driver: sqlite3.Database,
});

// Create table
await db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  username TEXT,
  message TEXT,
  channelId TEXT,
  serverId TEXT,
  timestamp INTEGER
)
`);

export async function saveMessage(message) {
  return await db.run(
    `INSERT INTO messages (channelId, userId, username, message, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [message.channel.id, message.author.id, message.author.username, message.content, Date.now()]
  );
}


export async function getRecentMessages(channelId, botUserId) {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

  return await db.all(
    `SELECT username, message 
     FROM messages 
     WHERE channelId = ? 
       AND timestamp > ? 
       AND userId != ? 
     ORDER BY timestamp DESC 
     LIMIT 20`,
    [channelId, thirtyMinutesAgo, botUserId]
  );
}

