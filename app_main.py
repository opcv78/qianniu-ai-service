# 主程序入口

import sys
import time
import keyboard
from pathlib import Path


def main():
    """入口函数"""
    # 确保工作目录正确（exe 运行时）
    if getattr(sys, "frozen", False):
        base_path = Path(sys.executable).parent
    else:
        base_path = Path(__file__).parent

    # 切换工作目录
    import os
    os.chdir(base_path)

    # ===== 先检查参数 =====
    if len(sys.argv) > 1 and sys.argv[1] == "--explore":
        print("[系统] 运行控件探测模式...")
        from rpa_worker import QianniuRPA
        rpa = QianniuRPA()
        rpa.test_coordinates()
        return

    # ===== 正常启动 =====
    from knowledge_base import FAQManager
    from llm_agent import CustomerServiceBrain
    from rpa_worker import QianniuRPA

    print("[系统] 正在初始化 AI 客服系统...")
    faq_manager = FAQManager()
    brain = CustomerServiceBrain()
    rpa = QianniuRPA()

    last_message = None
    running = True

    print("[系统] 初始化完成，按 ESC 键安全退出")
    print("[系统] 开始监控千牛消息...\n")

    # 主循环
    while running:
        try:
            if keyboard.is_pressed("esc"):
                print("\n[系统] 正在安全退出...")
                running = False
                break

            # 读取最新消息
            message = rpa.read_latest_message()

            # 跳过空消息或重复消息
            if not message or message == last_message:
                time.sleep(rpa.get_poll_interval())
                continue

            # 记录新消息
            last_message = message
            print(f"[收到] {message}")

            # 知识库检索
            context_chunks = faq_manager.search(message, k=3)
            context = "\n---\n".join(context_chunks) if context_chunks else None

            # 生成回复
            reply = brain.generate_reply(message, context)

            # 检查是否需要转人工
            if brain.needs_escalation(reply):
                print("\a")  # 系统警报声
                print("=" * 50)
                print("[警报] 检测到客户情绪激动，需要人工介入！")
                print("=" * 50)
                clean_reply = brain.clean_reply(reply)
                print(f"[回复] {clean_reply}")
                rpa.send_reply(clean_reply)
                print("[系统] 暂停 15 秒等待人工处理...")
                time.sleep(15)
                last_message = None
                continue

            # 发送回复
            clean_reply = brain.clean_reply(reply)
            print(f"[回复] {clean_reply}")
            rpa.send_reply(clean_reply)

            # 轮询间隔
            time.sleep(rpa.get_poll_interval())

        except KeyboardInterrupt:
            print("\n[系统] 正在安全退出...")
            running = False
            break
        except Exception as e:
            print(f"[错误] {e}")
            time.sleep(5)

    print("[系统] 已退出 AI 客服系统")


if __name__ == "__main__":
    main()