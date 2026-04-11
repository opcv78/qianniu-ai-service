# LLM 决策大脑模块

import yaml
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage


class CustomerServiceBrain:
    """客服 LLM 决策大脑"""

    SYSTEM_PROMPT = """你是一名专业的电商客服助手。你的职责是根据知识库内容回答客户问题。

## 核心规则
1. **必须基于知识库回答**：只能使用提供的上下文信息回答问题，不可编造信息。
2. **知识库无答案时**：礼貌告知客户"这个问题我需要确认一下，稍后回复您"。
3. **情绪识别**：如果检测到客户表达愤怒、不满或投诉情绪，必须在回复开头输出 `[ESCALATE]` 标记，然后继续给出正常回复。
4. **语气要求**：保持专业、友好、简洁，使用中文回复。

## 输出格式
- 正常回复：直接输出回复内容
- 需升级处理：`[ESCALATE]` + 换行 + 回复内容
"""

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.llm = self._init_llm()

    def _load_config(self, config_path: str) -> dict:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _init_llm(self) -> ChatOpenAI:
        llm_config = self.config.get("llm", {})
        return ChatOpenAI(
            model=llm_config.get("model", "gpt-4o-mini"),
            api_key=llm_config.get("api_key"),
            base_url=llm_config.get("base_url"),
            temperature=0.7,
        )

    def generate_reply(self, message: str, context: Optional[str] = None) -> str:
        """生成客服回复"""
        messages = [SystemMessage(content=self.SYSTEM_PROMPT)]

        # 构建用户消息
        user_content = message
        if context:
            user_content = f"""【知识库参考】
{context}

【客户消息】
{message}"""

        messages.append(HumanMessage(content=user_content))

        response = self.llm.invoke(messages)
        return response.content

    def needs_escalation(self, reply: str) -> bool:
        """判断回复是否需要升级处理"""
        return reply.strip().startswith("[ESCALATE]")

    def clean_reply(self, reply: str) -> str:
        """移除回复中的标记"""
        if reply.strip().startswith("[ESCALATE]"):
            return reply.strip()[11:].strip()
        return reply