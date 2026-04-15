# RPA 自动化控制模块
# 双重保险方案：内存对比法 + 剪贴板文本清洗法

import time
import random
import yaml
import re
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from collections import deque

import pyautogui
import pyperclip

try:
    import uiautomation as auto
    UIA_AVAILABLE = True
except ImportError:
    UIA_AVAILABLE = False


class QianniuRPA:
    """千牛桌面客户端 RPA 控制器 - 双重保险消息识别"""

    # 客服账号昵称特征（用于识别自己发送的消息）
    AGENT_NICKNAME = "[梨花重放的小店95]"

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self._init_coordinates()

        # 安全设置
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1

        # UI Automation 窗口缓存
        self.qianniu_window = None

        # ========== 双重保险方案一：内存对比法 ==========
        # 发送消息队列（使用 deque 自动限制长度）
        self.sent_messages_queue: deque = deque(maxlen=100)
        # 发送时间记录（用于时间窗口过滤）
        self.last_send_time: Optional[datetime] = None
        # 自消息过滤时间窗口（秒）
        self.self_message_window = 5.0

        # ========== 状态追踪 ==========
        self.last_processed_message = ""
        self.last_message_hash = ""

        if UIA_AVAILABLE:
            self._find_qianniu_window()

        print(f"[RPA] 客服昵称标识: {self.AGENT_NICKNAME}")
        print(f"[RPA] 自消息过滤窗口: {self.self_message_window}秒")

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
                if name and "-接待中心" in name:
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

    # ========== 方案一：内存对比法 ==========

    def _normalize_text(self, text: str) -> str:
        """文本标准化（用于比较）"""
        # 移除多余空格、换行
        text = re.sub(r'\s+', ' ', text.strip())
        # 移除常见的消息前缀标记
        text = re.sub(r'^\[.*?\]\s*', '', text)
        return text.lower()

    def _is_in_sent_queue(self, text: str) -> bool:
        """检查消息是否在发送队列中（内存对比法）"""
        normalized = self._normalize_text(text)

        for record in self.sent_messages_queue:
            sent_normalized = self._normalize_text(record.get("text", ""))

            # 完全匹配
            if normalized == sent_normalized:
                print(f"[内存对比] 完全匹配拦截: '{text[:30]}...'")
                return True

            # 部分匹配（防止消息有微小差异）
            if len(normalized) > 10 and normalized in sent_normalized:
                print(f"[内存对比] 包含匹配拦截: '{text[:30]}...'")
                return True

            if len(sent_normalized) > 10 and sent_normalized in normalized:
                print(f"[内存对比] 反包含匹配拦截: '{text[:30]}...'")
                return True

        return False

    def _is_in_time_window(self) -> bool:
        """检查是否在发送时间窗口内"""
        if self.last_send_time is None:
            return False

        elapsed = (datetime.now() - self.last_send_time).total_seconds()
        return elapsed < self.self_message_window

    def _record_sent_message(self, text: str):
        """记录发送的消息到队列"""
        record = {
            "text": text,
            "time": datetime.now(),
            "hash": hash(text)
        }
        self.sent_messages_queue.append(record)
        self.last_send_time = datetime.now()
        print(f"[发送记录] 已记录消息: '{text[:40]}...' (队列长度: {len(self.sent_messages_queue)})")

    # ========== 方案二：剪贴板文本清洗法 ==========

    def _clean_clipboard_text(self, raw_text: str) -> Optional[str]:
        """
        清洗剪贴板文本，过滤客服自己发送的消息段落

        千牛聊天记录格式通常为：
        [客服昵称] 2024-01-01 10:00:00
        客服发送的内容

        [客户昵称] 2024-01-01 10:01:00
        客户发送的内容
        """
        if not raw_text or not raw_text.strip():
            return None

        # === 调试：打印原始剪贴板内容 ===
        print(f"[调试] 原始剪贴板内容 (前500字符):\n{raw_text[:500]}")
        print(f"[调试] 原始剪贴板总行数: {len(raw_text.strip().split(chr(10)))}")

        lines = raw_text.strip().split('\n')
        customer_messages = []

        # 状态追踪
        current_sender = None
        current_message_lines = []

        # 消息发送者行模式：包含昵称和时间
        # 例如: "[梨花重放的小店95] 2024-04-14 10:30:00" 或 "[梨花重放的小店95] 10:30"
        sender_pattern = re.compile(r'^\[.+?\].*?\d{1,2}:\d{2}')

        # 调试：打印每行的匹配情况
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if not line_stripped:
                continue

            # 调试：显示每行内容和是否匹配发送者模式
            is_sender_line = sender_pattern.match(line_stripped)
            print(f"[调试] 行{i}: '{line_stripped[:60]}' | 发送者行={bool(is_sender_line)}")

            # 检查是否是发送者标识行
            if sender_pattern.match(line_stripped):
                # 保存上一条消息
                if current_sender and current_message_lines:
                    msg_text = '\n'.join(current_message_lines).strip()
                    if msg_text and current_sender != self.AGENT_NICKNAME:
                        customer_messages.append(msg_text)

                # 解析新发送者
                if self.AGENT_NICKNAME in line_stripped:
                    current_sender = self.AGENT_NICKNAME
                    print(f"[文本清洗] 检测到客服消息行: '{line_stripped[:50]}...'")
                else:
                    current_sender = "customer"

                current_message_lines = []
            else:
                # 消息内容行
                current_message_lines.append(line_stripped)

        # 处理最后一条消息
        if current_sender and current_message_lines:
            msg_text = '\n'.join(current_message_lines).strip()
            if msg_text and current_sender != self.AGENT_NICKNAME:
                customer_messages.append(msg_text)

        # 返回最后一条客户消息
        if customer_messages:
            last_customer_msg = customer_messages[-1]
            print(f"[文本清洗] 提取客户消息: '{last_customer_msg[:40]}...'")
            return last_customer_msg

        return None

    def _is_agent_message_by_nickname(self, text: str) -> bool:
        """通过客服昵称特征判断是否是自己发的消息"""
        # 直接包含客服昵称
        if self.AGENT_NICKNAME in text:
            print(f"[昵称识别] 消息包含客服昵称: '{text[:50]}...'")
            return True

        # 消息以客服昵称开头（发送者标识）
        if text.strip().startswith(self.AGENT_NICKNAME):
            print(f"[昵称识别] 消息以客服昵称开头")
            return True

        # 消息中有客服昵称的发送者行格式
        pattern = re.compile(rf'\[{re.escape(self.AGENT_NICKNAME)}\]|\[{re.escape(self.AGENT_NICKNAME)}\s*\d')
        if pattern.search(text):
            print(f"[昵称识别] 消息包含客服发送者标识格式")
            return True

        return False

    # ========== 双重保险综合判断 ==========

    def _is_self_message(self, text: str) -> bool:
        """
        双重保险判断：是否是自己发送的消息
        1. 内存对比法：检查发送队列
        2. 时间窗口法：发送后短时间内拦截
        3. 昵称识别法：识别客服昵称特征
        """
        # 方法1: 内存对比法 - 检查发送队列
        if self._is_in_sent_queue(text):
            return True

        # 方法2: 时间窗口法 - 发送后短时间内认为是自己的消息
        if self._is_in_time_window():
            # 在时间窗口内，再做一次模糊匹配
            normalized = self._normalize_text(text)
            for record in self.sent_messages_queue:
                # 时间窗口内的记录
                record_time = record.get("time", datetime.min)
                if (datetime.now() - record_time).total_seconds() < self.self_message_window:
                    sent_normalized = self._normalize_text(record.get("text", ""))
                    # 相似度检查（简单的前缀匹配）
                    if len(normalized) > 5 and len(sent_normalized) > 5:
                        if normalized[:20] == sent_normalized[:20]:
                            print(f"[时间窗口] 拦截相似消息: '{text[:30]}...'")
                            return True
            # 时间窗口内但无匹配记录，可能是客户快速回复
            # 不拦截，继续检查

        # 方法3: 昵称识别法 - 检查是否包含客服昵称
        if self._is_agent_message_by_nickname(text):
            return True

        return False

    def _read_via_clipboard(self) -> Optional[str]:
        """通过剪贴板读取消息（使用文本清洗法）"""
        try:
            # 点击聊天区域
            self._click_at(self.chat_list_x, self.chat_list_y)
            self._random_delay(0.2, 0.4)

            # 全选并复制
            pyautogui.hotkey("ctrl", "a")
            self._random_delay(0.2, 0.4)
            pyautogui.hotkey("ctrl", "c")
            self._random_delay(0.2, 0.4)

            # 获取剪贴板内容
            clipboard_text = pyperclip.paste()
            if not clipboard_text:
                return None

            # 使用文本清洗法提取客户消息
            clean_message = self._clean_clipboard_text(clipboard_text)

            if not clean_message:
                print("[剪贴板] 清洗后无有效客户消息")
                return None

            # 双重保险：再检查是否是自己发的
            if self._is_self_message(clean_message):
                print(f"[双重拦截] 剪贴板提取的消息被拦截: '{clean_message[:30]}...'")
                return None

            # 检查是否重复处理
            if clean_message == self.last_processed_message:
                return None

            self.last_processed_message = clean_message
            return clean_message

        except Exception as e:
            print(f"[RPA Error] 读取消息失败: {e}")
            return None

    def read_latest_message(self) -> Optional[str]:
        """
        读取最新客户消息
        使用双重保险方案过滤自己发送的消息
        """
        message = self._read_via_clipboard()

        if message:
            # 最终安全检查
            if self._is_self_message(message):
                return None

            print(f"[收到消息] {message[:60]}...")
            return message

        return None

    def send_reply(self, text: str):
        """
        发送回复消息
        并使用内存对比法记录发送内容
        """
        if not text:
            return

        try:
            # 方案一：记录到发送队列（内存对比法）
            self._record_sent_message(text)

            # 执行发送
            pyperclip.copy(text)
            self._random_delay(0.3, 0.6)

            self._click_at(self.input_box_x, self.input_box_y)
            self._random_delay(0.3, 0.6)

            pyautogui.hotkey("ctrl", "v")
            self._random_delay(0.5, 1.0)

            self._click_at(self.send_btn_x, self.send_btn_y)
            self._random_delay(0.2, 0.4)

            # 清空上次处理的消息（防止重复）
            self.last_processed_message = ""

            print(f"[发送成功] {text[:60]}...")

        except Exception as e:
            print(f"[RPA Error] 发送消息失败: {e}")
            # 发送失败时从队列移除
            # 由于使用 deque，这条记录会自然被后续覆盖

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

    def clear_sent_queue(self):
        """清空发送队列（用于重置状态）"""
        self.sent_messages_queue.clear()
        self.last_send_time = None
        self.last_processed_message = ""
        print("[状态] 已清空发送队列")

    def get_stats(self) -> dict:
        """获取当前状态统计（用于调试）"""
        return {
            "sent_queue_length": len(self.sent_messages_queue),
            "last_send_time": self.last_send_time.strftime("%H:%M:%S") if self.last_send_time else None,
            "time_window_elapsed": (datetime.now() - self.last_send_time).total_seconds() if self.last_send_time else None,
            "agent_nickname": self.AGENT_NICKNAME,
            "coordinates": {
                "chat_list": (self.chat_list_x, self.chat_list_y),
                "input_box": (self.input_box_x, self.input_box_y),
                "send_btn": (self.send_btn_x, self.send_btn_y),
            },
        }

    def test_coordinates(self):
        """测试坐标是否正确 - 会依次点击各个区域并在剪贴板显示结果"""
        print("\n[坐标测试] 开始测试...")
        print(f"[坐标测试] 聊天列表坐标: ({self.chat_list_x}, {self.chat_list_y})")

        # 点击聊天区域
        print("[坐标测试] 点击聊天列表区域...")
        self._click_at(self.chat_list_x, self.chat_list_y)
        time.sleep(0.5)

        # 全选并复制
        pyautogui.hotkey("ctrl", "a")
        time.sleep(0.3)
        pyautogui.hotkey("ctrl", "c")
        time.sleep(0.3)

        clipboard_text = pyperclip.paste()
        print(f"[坐标测试] 剪贴板内容 (前300字符):\n{clipboard_text[:300]}")
        print(f"[坐标测试] 剪贴板总长度: {len(clipboard_text)} 字符")

        print("\n[坐标测试] 如果上面显示的不是聊天记录，请调整 config.yaml 中的坐标:")
        print("  - chat_list_x, chat_list_y: 聊天消息显示区域")
        print("  - input_box_x, input_box_y: 输入框")
        print("  - send_btn_x, send_btn_y: 发送按钮")
        print("\n[坐标测试] 建议用截图工具测量千牛窗口中各区域的坐标")