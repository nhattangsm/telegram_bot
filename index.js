const TelegramBot = require('node-telegram-bot-api');
const pool = require('./db');
const { formatCurrency, getCurrentDate } = require('./utils');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_ID;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (msg.from.id.toString() === ADMIN_ID) {
    bot.sendMessage(chatId, '✅ Bot đã sẵn sàng. Bạn là admin.');
  } else {
    bot.sendMessage(chatId, '❌ Bạn không có quyền sử dụng bot này.');
  }
});

bot.onText(/\/add (.+) (\d+)/, async (msg, match) => {
  if (msg.from.id.toString() !== ADMIN_ID) return;

  const name = match[1];
  const amount = parseInt(match[2], 10);
  const date = getCurrentDate();

  try {
    const [rows] = await pool.query('INSERT INTO congno (name, amount, date) VALUES (?, ?, ?)', [name, amount, date]);
    bot.sendMessage(msg.chat.id, `✅ Đã thêm công nợ: ${name} - ${formatCurrency(amount)}`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Lỗi khi thêm công nợ.');
  }
});

bot.onText(/\/list/, async (msg) => {
  if (msg.from.id.toString() !== ADMIN_ID) return;

  try {
    const [rows] = await pool.query('SELECT * FROM congno ORDER BY date DESC');
    if (rows.length === 0) {
      return bot.sendMessage(msg.chat.id, '📭 Không có công nợ nào.');
    }

    const text = rows
      .map(row => `📌 *${row.name}* - ${formatCurrency(row.amount)} (📅 ${row.date})`)
      .join('\n');

    bot.sendMessage(msg.chat.id, `📋 Danh sách công nợ:\n\n${text}`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Lỗi khi lấy danh sách công nợ.');
  }
});

bot.onText(/\/delete (\d+)/, async (msg, match) => {
  if (msg.from.id.toString() !== ADMIN_ID) return;

  const id = parseInt(match[1], 10);
  try {
    const [result] = await pool.query('DELETE FROM congno WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return bot.sendMessage(msg.chat.id, '❌ Không tìm thấy công nợ với ID đó.');
    }
    bot.sendMessage(msg.chat.id, `🗑️ Đã xóa công nợ có ID ${id}`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Lỗi khi xóa công nợ.');
  }
});
