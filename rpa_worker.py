# RPA 自动化控制模块

import time
import random
import yaml
from typing import Optional, List

import pyautogui
import pyperclip

try:
    import uiautomation as auto
    UIA_AVAILABLE = True
except ImportError:
    UIA_AVAILABLE = False


class QianniuRPA:
    """千牛桌面客户端 RPA 控制器"""

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self._init_coordinates()

        # 安全设置
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1

        # UI Automation 窗口缓存
        self.qianniu_window = None
        self.last_message_text = ""

        if UIA_AVAILABLE:
            self._find_qianniu_window()

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

    def _find_qianniu_window(self):
        """查找千牛聊天窗口"""
        if not UIA_AVAILABLE:
            return False

        try:
            # 千牛接待中心窗口格式: "[用户名]-接待中心"
            for win in auto.GetRootControl().GetChildren():
                name = win.Name
                if name and ("接待中心" in name or "-接待中心" in name):
                    self.qianniu_window = win
                    print(f"[UIA] 已找到窗口: {name}")
                    return True

            # 尝试其他可能的窗口名
            for win in auto.GetRootControl().GetChildren():
                name = win.Name
                if name and ("千牛" in name or "阿里旺旺" in name):
                    self.qianniu_window = win
                    print(f"[UIA] 已找到窗口: {name}")
                    return True

            print("[UIA] 未找到千牛窗口")
            return False
        except Exception as e:
            print(f"[UIA Error] 查找窗口失败: {e}")
            return False

    def _get_chat_messages(self) -> List[dict]:
        """通过 UI Automation 获取聊天消息列表"""
        if not UIA_AVAILABLE or not self.qianniu_window:
            return []

        messages = []
        try:
            # 查找聊天消息列表控件（通常是 List 或 Panel 类型）
            # 千牛的消息控件结构需要实际调试确认
            chat_list = self.qianniu_window.ListControl(searchDepth=10)

            if chat_list and chat_list.Exists(0, 0):
                # 遍历消息项
                for item in chat_list.GetChildren():
                    try:
                        # 获取消息文本
                        text_ctrl = item.TextControl(searchDepth=5)
                        if text_ctrl and text_ctrl.Name:
                            msg_text = text_ctrl.Name.strip()
                            if msg_text:
                                # 尝试判断消息来源（客户 vs 客服）
                                # 千牛通常用不同控件或样式区分
                                messages.append({
                                    "text": msg_text,
                                    "is_customer": True,  # 默认假设是客户消息
                                    "control": item
                                })
                    except:
                        continue

            # 如果找不到 List，尝试直接查找所有 Text 控件
            if not messages:
                text_controls = self.qianniu_window.GetChildren()
                for ctrl in text_controls:
                    try:
                        text_ctrls = ctrl.GetFirstChildControl().GetChildren() if ctrl.GetFirstChildControl() else []
                        for tc in text_ctrls:
                            if hasattr(tc, 'Name') and tc.Name:
                                msg_text = tc.Name.strip()
                                if msg_text and len(msg_text) > 0:
                                    messages.append({
                                        "text": msg_text,
                                        "is_customer": True
                                    })
                    except:
                        continue

        except Exception as e:
            print(f"[UIA Error] 获取消息失败: {e}")

        return messages

    def read_latest_message(self) -> Optional[str]:
        """
        读取聊天区最新消息
        使用 UI Automation 或剪贴板方法
        """
        # 优先使用 UI Automation
        if UIA_AVAILABLE and self.qianniu_window:
            try:
                messages = self._get_chat_messages()
                if messages:
                    # 获取最后一条文本消息（过滤图片表情）
                    for msg in reversed(messages):
                        text = msg.get("text", "")
                        # 过滤非文本内容（图片通常返回空或特殊字符）
                        if text and not text.startswith("[图片]") and not text.startswith("[表情]"):
                            if text != self.last_message_text:
                                self.last_message_text = text
                                return text
                    return None
            except Exception as e:
                print(f"[UIA Error] {e}")

        # 备用方案：剪贴板方法
        return self._read_via_clipboard()

    def _read_via_clipboard(self) -> Optional[str]:
        """备用：通过剪贴板读取消息"""
        try:
            self._click_at(self.chat_list_x, self.chat_list_y)
            self._random_delay(0.2, 0.4)

            pyautogui.hotkey("ctrl", "a")
            self._random_delay(0.2, 0.4)
            pyautogui.hotkey("ctrl", "c")
            self._random_delay(0.2, 0.4)

            clipboard_text = pyperclip.paste()
            if not clipboard_text:
                return None

            lines = [line.strip() for line in clipboard_text.split("\n") if line.strip()]
            if lines:
                last_line = lines[-1]
                if last_line != self.last_message_text:
                    self.last_message_text = last_line
                    return last_line
            return None

        except Exception as e:
            print(f"[RPA Error] 读取消息失败: {e}")
            return None

    def send_reply(self, text: str):
        """发送回复消息"""
        if not text:
            return

        try:
            pyperclip.copy(text)
            self._random_delay(0.3, 0.6)

            self._click_at(self.input_box_x, self.input_box_y)
            self._random_delay(0.3, 0.6)

            pyautogui.hotkey("ctrl", "v")
            self._random_delay(0.5, 1.0)

            self._click_at(self.send_btn_x, self.send_btn_y)
            self._random_delay(0.2, 0.4)

            # 清空上次消息记录（发送后重置）
            self.last_message_text = ""

        except Exception as e:
            print(f"[RPA Error] 发送消息失败: {e}")

    def focus_window(self):
        """激活千牛窗口"""
        if UIA_AVAILABLE and self.qianniu_window:
            try:
                self.qianniu_window.SetFocus()
                self._random_delay(0.3, 0.5)
                return
            except:
                pass
        self._click_at(self.chat_list_x, self.chat_list_y)

    def get_poll_interval(self) -> int:
        """获取轮询间隔"""
        return self.config.get("rpa", {}).get("poll_interval", 3)

    def refresh_window(self):
        """刷新窗口查找（窗口可能被关闭重开）"""
        if UIA_AVAILABLE:
            self._find_qianniu_window()