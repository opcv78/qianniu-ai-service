# 主程序入口

import sys
from pathlib import Path


def main():
    """入口函数"""
    # 确保工作目录正确（exe 运行时）
    if getattr(sys, "frozen", False):
        # PyInstaller 打包后的路径
        base_path = Path(sys.executable).parent
    else:
        # 开发环境路径
        base_path = Path(__file__).parent

    # 切换工作目录
    import os
    os.chdir(base_path)

    # ===== 先检查参数，避免不必要的初始化 =====
    if len(sys.argv) > 1 and sys.argv[1] == "--explore":
        print("[系统] 运行控件探测模式...")
        from rpa_worker import QianniuRPA
        rpa = QianniuRPA()
        rpa.test_coordinates()
        return

    # ===== 正常启动 =====
    import time
    import keyboard
    from knowledge_base import FAQManager
    from llm_agent import CustomerServiceBrain
    from rpa_worker import QianniuRPA

    service = QianniuAIService()
    service.run()


class QianniuAIService:
    """千牛 AI 客服主控制器"""

    def __init__(self):
        print("[系统] 正在初始化 AI 客服系统...")

        # 初始化各模块
        self.faq_manager = FAQManager()
        self.brain = CustomerServiceBrain()
        self.rpa = QianniuRPA()

        # 状态追踪
        self.last_message = None
        self.running = True

        print("[系统] 初始化完成，按 ESC 键安全退出")
        print("[系统] 开始监控千牛消息...\n")

    def run(self):
        """主循环"""
        while self.running:
            try:
                # 检查退出热键
                if keyboard.is_pressed("esc"):
                    self.shutdown()
                    break

                # 读取最新消息
                message = self.rpa.read_latest_message()

                # 跳过空消息或重复消息
                if not message or message == self.last_message:
                    time.sleep(self.rpa.get_poll_interval())
                    continue

                # 记录新消息
                self.last_message = message
                print(f"[收到] {message}")

                # 知识库检索
                context_chunks = self.faq_manager.search(message, k=3)
                context = "\n---\n".join(context_chunks) if context_chunks else None

                # 生成回复
                reply = self.brain.generate_reply(message, context)

                # 检查是否需要转人工
                if self.brain.needs_escalation(reply):
                    self._handle_escalation(reply)
                    continue

                # 发送回复
                clean_reply = self.brain.clean_reply(reply)
                print(f"[回复] {clean_reply}")
                self.rpa.send_reply(clean_reply)

                # 轮询间隔
                time.sleep(self.rpa.get_poll_interval())

            except KeyboardInterrupt:
                self.shutdown()
                break
            except Exception as e:
                print(f"[错误] {e}")
                time.sleep(5)

    def _handle_escalation(self, reply: str):
        """处理需要转人工的情况"""
        print("\a")  # 系统警报声
        print("=" * 50)
        print("[警报] 检测到客户情绪激动，需要人工介入！")
        print("=" * 50)

        clean_reply = self.brain.clean_reply(reply)
        print(f"[回复] {clean_reply}")
        self.rpa.send_reply(clean_reply)

        print("[系统] 暂停 15 秒等待人工处理...")
        time.sleep(15)
        self.last_message = None  # 重置状态

    def shutdown(self):
        """安全关闭"""
        print("\n[系统] 正在安全退出...")
        self.running = False
        print("[系统] 已退出 AI 客服系统")
        sys.exit(0)


if __name__ == "__main__":
    main()