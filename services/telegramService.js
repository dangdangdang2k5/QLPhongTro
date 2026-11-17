require('dotenv').config();

class TelegramService {
    static getBotToken() {
        return (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    }

    /**
     * Tách danh sách Chat ID (phân cách bởi dấu phẩy, chấm phẩy hoặc khoảng trắng)
     */
    static parseChatIds(chatIdsInput) {
        if (!chatIdsInput) return [];
        if (Array.isArray(chatIdsInput)) return chatIdsInput.map(id => String(id).trim()).filter(Boolean);
        return String(chatIdsInput).split(/[,;\s]+/).map(id => id.trim()).filter(Boolean);
    }

    /**
     * Gửi tin nhắn Telegram thông báo chuẩn HTML tới một hoặc nhiều người nhận
     */
    static async sendTelegramMessage(chatId, message, parseMode = 'HTML') {
        const token = this.getBotToken();
        if (!token) {
            console.log('[Telegram] TELEGRAM_BOT_TOKEN chưa được cấu hình.');
            return false;
        }

        const chatIds = this.parseChatIds(chatId);
        if (chatIds.length === 0) {
            console.log('[Telegram] Chat ID không hợp lệ.');
            return false;
        }

        let atLeastOneSuccess = false;
        for (const cid of chatIds) {
            try {
                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: cid,
                        text: message,
                        parse_mode: parseMode
                    }),
                    signal: AbortSignal.timeout(10000)
                });
                const data = await response.json();
                if (data.ok) {
                    atLeastOneSuccess = true;
                    console.log(`[Telegram] Đã gửi thông báo thành công tới Chat ID: ${cid}`);
                } else {
                    console.error(`[Telegram] Lỗi Telegram API: ${data.description}`);
                }
            } catch (err) {
                console.error(`[Telegram] Không thể kết nối tới Telegram API: ${err.message}`);
            }
        }
        return atLeastOneSuccess;
    }

    /**
     * Gửi tin nhắn kèm nút bấm Inline Keyboard Button (ví dụ: Mở Admin Dashboard)
     */
    static async sendTelegramMessageWithButton(chatId, message, buttonText, buttonUrl, parseMode = 'HTML') {
        const token = this.getBotToken();
        if (!token) {
            console.log('[Telegram] TELEGRAM_BOT_TOKEN chưa được cấu hình.');
            return false;
        }

        const chatIds = this.parseChatIds(chatId);
        if (chatIds.length === 0) return false;

        let atLeastOneSuccess = false;
        for (const cid of chatIds) {
            try {
                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: cid,
                        text: message,
                        parse_mode: parseMode,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: buttonText, url: buttonUrl }]
                            ]
                        }
                    }),
                    signal: AbortSignal.timeout(10000)
                });
                const data = await response.json();
                if (data.ok) {
                    atLeastOneSuccess = true;
                    console.log(`[Telegram] Gửi tin nhắn kèm nút bấm tới Chat ID: ${cid} thành công.`);
                } else {
                    console.error(`[Telegram] Lỗi Telegram API: ${data.description}`);
                }
            } catch (err) {
                console.error(`[Telegram] Lỗi gửi tin nhắn kèm nút: ${err.message}`);
            }
        }
        return atLeastOneSuccess;
    }

    /**
     * Kích hoạt Webhook với Telegram API
     */
    static async setWebhook(webhookUrl) {
        const token = this.getBotToken();
        if (!token) return false;

        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: webhookUrl }),
                signal: AbortSignal.timeout(10000)
            });
            const data = await response.json();
            return data.ok === true;
        } catch (err) {
            console.error(`[Telegram] Lỗi kích hoạt Webhook: ${err.message}`);
            return false;
        }
    }
}

module.exports = TelegramService;
