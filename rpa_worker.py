# RPA 自动化控制模块

import time
import random
import yaml
from typing import Optional

import pyautogui
import pyperclip


class QianniuRPA:
    """千牛桌面客户端 RPA 控制器"""

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self._init_coordinates()

        # 安全设置
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1

    def _load_config(self, config_path: str) -> dict:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _init_coordinates(self):
        """初始化屏幕坐标"""
        rpa_config = self.config.get("rpa", {})
        self.chat_list_x = rpa_config.get("chat_list_x", 100)
        self.chat_list_y = rpa_config.get("chat_list_y", 200)
        self.input_box_x = rpa_config.get("input_box_x", 300)
        self.input_box_y = rpa_config.get("input_box_y", 600)
        self.send_btn_x = rpa_config.get("send_btn_x", 500)
        self.send_btn_y = rpa_config.get("send_btn_y", 600)

    def _random_delay(self, min_sec: float = 0.3, max_sec: float = 0.8):
        """随机延迟，模拟人类操作"""
        time.sleep(random.uniform(min_sec, max_sec))

    def _click_at(self, x: int, y: int, clicks: int = 1):
        """点击指定坐标"""
        pyautogui.click(x=x, y=y, clicks=clicks)
        self._random_delay()

    def read_latest_message(self) -> Optional[str]:
        """
        读取聊天区最新消息
        点击聊天区 -> 全选 -> 复制 -> 解析最后一行
        """
        try:
            # 点击聊天记录区获取焦点
            self._click_at(self.chat_list_x, self.chat_list_y)
            self._random_delay(0.2, 0.4)

            # 全选并复制
            pyautogui.hotkey("ctrl", "a")
            self._random_delay(0.2, 0.4)
            pyautogui.hotkey("ctrl", "c")
            self._random_delay(0.2, 0.4)

            # 从剪贴板读取
            clipboard_text = pyperclip.paste()
            if not clipboard_text:
                return None

            # 按换行分割，过滤空行，返回最后一行有效消息
            lines = [line.strip() for line in clipboard_text.split("\n") if line.strip()]
            return lines[-1] if lines else None

        except Exception as e:
            print(f"[RPA Error] 读取消息失败: {e}")
            return None

    def send_reply(self, text: str):
        """
        发送回复消息
        写入剪贴板 -> 点击输入框 -> 粘贴 -> 发送
        """
        if not text:
            return

        try:
            # 将回复写入剪贴板
            pyperclip.copy(text)
            self._random_delay(0.3, 0.6)

            # 点击输入框获取焦点
            self._click_at(self.input_box_x, self.input_box_y)
            self._random_delay(0.3, 0.6)

            # 粘贴内容（带打字机效果延迟）
            pyautogui.hotkey("ctrl", "v")
            self._random_delay(0.5, 1.0)  # 打字机延迟

            # 点击发送按钮
            self._click_at(self.send_btn_x, self.send_btn_y)
            self._random_delay(0.2, 0.4)

        except Exception as e:
            print(f"[RPA Error] 发送消息失败: {e}")

    def focus_window(self):
        """点击千牛窗口激活"""
        self._click_at(self.chat_list_x, self.chat_list_y)

    def get_poll_interval(self) -> int:
        """获取轮询间隔"""
        return self.config.get("rpa", {}).get("poll_interval", 3)