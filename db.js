import sqlite3 from "sqlite3";
import { open } from "sqlite";

// ✅ Initialize database
export const db = await open({
  filename: "./messages.db",
  driver: sqlite3.Database,
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId TEXT,
    username TEXT,
    message TEXT,
    timestamp INTEGER
  )
`);

// ✅ Save message with duplicate prevention
export async function saveMessage(message) {
  const content = message.content.trim();
  if (!content) return; // Empty message skip

  // Check last message to avoid immediate duplicate
  const last = await db.get(
    `SELECT message FROM messages WHERE channelId = ? ORDER BY timestamp DESC LIMIT 1`,
    [message.channel.id]
  );

  if (last && last.message === content) {
    console.log("⚠️ Skipping duplicate save:", content);
    return;
  }

  await db.run(
    `INSERT INTO messages (channelId, username, message, timestamp) VALUES (?, ?, ?, ?)`,
    [message.channel.id, message.author.username, content, Date.now()]
  );
}

// ✅ Fetch last 20 messages (30 min window)
export async function getRecentMessages(channelId) {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  return await db.all(
    `SELECT username, message FROM messages 
     WHERE channelId = ? AND timestamp > ? 
     ORDER BY timestamp DESC LIMIT 20`,
    [channelId, thirtyMinutesAgo]
  );
}
