import os
import json
import urllib.request
import urllib.parse
import urllib.error

def get_bot_token():
    """Lay Telegram Bot Token tu bien moi truong."""
    return os.getenv('TELEGRAM_BOT_TOKEN', '').strip()

def send_telegram_message(chat_id, message, parse_mode='HTML'):
    """
    Gui tin nhan thong bao qua Telegram Bot API.
    
    :param chat_id: ID phong chat / nguoi nhan Telegram
    :param message: Noi dung tin nhan (ho tro HTML format)
    :param parse_mode: 'HTML' hoac 'Markdown'
    :return: True neu gui thanh cong, False neu that bai
    """
    bot_token = get_bot_token()
    if not bot_token:
        print('[Telegram] TELEGRAM_BOT_TOKEN chua duoc cau hinh trong Environment Variables.')
        return False

    if not chat_id:
        print('[Telegram] Chat ID nguoi nhan khong hop le hoac chua duoc cau hinh.')
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': str(chat_id).strip(),
        'text': message,
        'parse_mode': parse_mode
    }

    return _execute_telegram_request(url, payload)

def send_telegram_message_with_button(chat_id, message, button_text, button_url, parse_mode='HTML'):
    """
    Gui tin nhan Telegram kem nut bam link (Inline Keyboard Button).
    
    :param chat_id: ID phong chat / nguoi nhan Telegram
    :param message: Noi dung tin nhan
    :param button_text: Chu tren nut bam
    :param button_url: Link URL khi bam vao nut
    :param parse_mode: 'HTML' hoac 'Markdown'
    :return: True neu gui thanh cong, False neu that bai
    """
    bot_token = get_bot_token()
    if not bot_token:
        print('[Telegram] TELEGRAM_BOT_TOKEN chua duoc cau hinh trong Environment Variables.')
        return False

    if not chat_id:
        print('[Telegram] Chat ID nguoi nhan khong hop le hoac chua duoc cau hinh.')
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': str(chat_id).strip(),
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
                print('[Telegram] Telegram notification sent successfully.')
                return True
            else:
                desc = res_data.get('description', 'Unknown Telegram API error')
                print(f'[Telegram] Telegram API tra ve loi: {desc}')
                return False
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode('utf-8'))
            desc = err_body.get('description', e.reason)
        except Exception:
            desc = str(e.reason)
        print(f'[Telegram] HTTP Error ({e.code}): {desc}')
        return False
    except urllib.error.URLError as e:
        print(f'[Telegram] Network / URL Error: {e.reason}')
        return False
    except Exception as e:
        print(f'[Telegram] Loi ngoai le khi gui tin nhan: {type(e).__name__}')
        return False
