import os
import re
import json
import urllib.request
import urllib.parse
import urllib.error

def get_bot_token():
    """Lay Telegram Bot Token tu bien moi truong."""
    return os.getenv('TELEGRAM_BOT_TOKEN', '').strip()

def parse_chat_ids(chat_ids_input):
    """
    Tach danh sach Chat ID neu co nhieu ID (phan cach bang dau phay, cham phay hoac khoang trang).
    Vi du: '123456, 987654' -> ['123456', '987654']
    """
    if isinstance(chat_ids_input, list):
        return [str(cid).strip() for cid in chat_ids_input if str(cid).strip()]
    if not chat_ids_input:
        return []
    parts = re.split(r'[,;\s]+', str(chat_ids_input).strip())
    return [p for p in parts if p]

def send_telegram_message(chat_id, message, parse_mode='HTML'):
    """
    Gui tin nhan thong bao qua Telegram Bot API cho 1 hoac nhieu Chat ID.
    
    :param chat_id: ID phong chat / nguoi nhan (hoac chuoi nhieu ID phan cach boi dau phay)
    :param message: Noi dung tin nhan (ho tro HTML format)
    :param parse_mode: 'HTML' hoac 'Markdown'
    :return: True neu it nhat 1 nguoi nhan thanh cong, False neu that bai toan bo
    """
    bot_token = get_bot_token()
    if not bot_token:
        print('[Telegram] TELEGRAM_BOT_TOKEN chua duoc cau hinh trong Environment Variables.')
        return False

    cids = parse_chat_ids(chat_id)
    if not cids:
        print('[Telegram] Chat ID nguoi nhan khong hop le hoac chua duoc cau hinh.')
        return False

    success_any = False
    for cid in cids:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': cid,
            'text': message,
            'parse_mode': parse_mode
        }
        if _execute_telegram_request(url, payload):
            success_any = True

    return success_any

def send_telegram_message_with_button(chat_id, message, button_text, button_url, parse_mode='HTML'):
    """
    Gui tin nhan Telegram kem nut bam link (Inline Keyboard Button) cho 1 hoac nhieu Chat ID.
    
    :param chat_id: ID phong chat / nguoi nhan (hoac chuoi nhieu ID phan cach boi dau phay)
    :param message: Noi dung tin nhan
    :param button_text: Chu tren nut bam
    :param button_url: Link URL khi bam vao nut
    :param parse_mode: 'HTML' hoac 'Markdown'
    :return: True neu it nhat 1 nguoi nhan thanh cong, False neu that bai toan bo
    """
    bot_token = get_bot_token()
    if not bot_token:
        print('[Telegram] TELEGRAM_BOT_TOKEN chua duoc cau hinh trong Environment Variables.')
        return False

    cids = parse_chat_ids(chat_id)
    if not cids:
        print('[Telegram] Chat ID nguoi nhan khong hop le hoac chua duoc cau hinh.')
        return False

    success_any = False
    for cid in cids:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': cid,
            'text': message,
            'parse_mode': parse_mode,
            'reply_markup': {
                'inline_keyboard': [
                    [
                        {
                            'text': button_text,
                            'url': button_url
                        }
                    ]
                ]
            }
        }
        if _execute_telegram_request(url, payload):
            success_any = True

    return success_any

def set_telegram_webhook(webhook_url):
    """
    Dang ky Webhook voi Telegram de nhan tin nhan /start tu dong.
    
    :param webhook_url: URL cong khai cua webhook (vi du: https://qlphongtro-j7mw.onrender.com/telegram/webhook)
    :return: True neu dang ky thanh cong, False neu that bai
    """
    bot_token = get_bot_token()
    if not bot_token:
        print('[Telegram] TELEGRAM_BOT_TOKEN chua duoc cau hinh.')
        return False

    url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
    payload = {
        'url': webhook_url
    }
    return _execute_telegram_request(url, payload)

def _execute_telegram_request(url, payload):
    """Thuc thi HTTP POST request den Telegram API mot cach an toan (khong log Token)."""
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if res_data.get('ok'):
                print(f"[Telegram] Gui thanh cong toi Chat ID: {payload.get('chat_id')}")
                return True
            else:
                desc = res_data.get('description', 'Unknown Telegram API error')
                print(f"[Telegram] Telegram API tra ve loi cho Chat ID {payload.get('chat_id')}: {desc}")
                return False
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode('utf-8'))
            desc = err_body.get('description', e.reason)
        except Exception:
            desc = str(e.reason)
        print(f"[Telegram] HTTP Error ({e.code}) cho Chat ID {payload.get('chat_id')}: {desc}")
        return False
    except urllib.error.URLError as e:
        print(f'[Telegram] Network / URL Error: {e.reason}')
        return False
    except Exception as e:
        print(f'[Telegram] Loi ngoai le khi gui request: {type(e).__name__}')
        return False
