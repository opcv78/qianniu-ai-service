# 知识库检索模块

import yaml
from pathlib import Path
from typing import List, Optional

from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma


class FAQManager:
    """FAQ 知识库管理器，负责文档加载、向量化和检索"""

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.embeddings = self._init_embeddings()
        self.vectorstore: Optional[Chroma] = None
        self._init_vectorstore()

    def _load_config(self, config_path: str) -> dict:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _init_embeddings(self) -> OpenAIEmbeddings:
        kb_config = self.config.get("knowledge", {})
        llm_config = self.config.get("llm", {})
        return OpenAIEmbeddings(
            model=kb_config.get("embedding_model", "text-embedding-3-small"),
            openai_api_key=llm_config.get("api_key"),
            openai_api_base=llm_config.get("base_url"),
        )

    def _load_and_split_faq(self) -> List:
        """加载 Markdown 并按标题切割"""
        kb_config = self.config.get("knowledge", {})
        faq_path = kb_config.get("faq_path", "data/faq.md")

        with open(faq_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 按二级标题切割
        headers_to_split = [("#", "Header1"), ("##", "Header2")]
        splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split)
        return splitter.split_text(content)

    def _init_vectorstore(self):
        """初始化或加载向量库"""
        kb_config = self.config.get("knowledge", {})
        persist_dir = kb_config.get("chroma_persist_dir", "data/chroma_db")

        if Path(persist_dir).exists() and any(Path(persist_dir).iterdir()):
            # 加载已有向量库
            self.vectorstore = Chroma(
                persist_directory=persist_dir,
                embedding_function=self.embeddings,
            )
        else:
            # 创建新向量库
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            docs = self._load_and_split_faq()
            if docs:
                self.vectorstore = Chroma.from_documents(
                    documents=docs,
                    embedding=self.embeddings,
                    persist_directory=persist_dir,
                )

    def search(self, query: str, k: int = 3) -> List[str]:
        """检索相关知识片段"""
        if not self.vectorstore:
            return []
        results = self.vectorstore.similarity_search(query, k=k)
        return [doc.page_content for doc in results]

    def rebuild_index(self):
        """重建向量索引"""
        kb_config = self.config.get("knowledge", {})
        persist_dir = kb_config.get("chroma_persist_dir", "data/chroma_db")

        docs = self._load_and_split_faq()
        if docs:
            self.vectorstore = Chroma.from_documents(
                documents=docs,
                embedding=self.embeddings,
                persist_directory=persist_dir,
            )