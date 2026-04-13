# 知识库检索模块

import yaml
from pathlib import Path
from typing import List, Optional

from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_chroma import Chroma

# Embedding 支持多种方式
try:
    from langchain_openai import OpenAIEmbeddings
    OPENAI_EMBEDDINGS_AVAILABLE = True
except ImportError:
    OPENAI_EMBEDDINGS_AVAILABLE = False

try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    HF_EMBEDDINGS_AVAILABLE = True
except ImportError:
    HF_EMBEDDINGS_AVAILABLE = False


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

    def _init_embeddings(self):
        """初始化 Embedding 模型，支持 OpenAI API 或本地 HuggingFace"""
        kb_config = self.config.get("knowledge", {})
        llm_config = self.config.get("llm", {})
        embedding_type = kb_config.get("embedding_type", "local")  # 默认使用本地

        if embedding_type == "openai" and OPENAI_EMBEDDINGS_AVAILABLE:
            # 使用 OpenAI API embeddings
            try:
                return OpenAIEmbeddings(
                    model=kb_config.get("embedding_model", "text-embedding-3-small"),
                    openai_api_key=llm_config.get("api_key"),
                    openai_api_base=llm_config.get("base_url"),
                )
            except Exception as e:
                print(f"[KB Error] OpenAI Embeddings 初始化失败: {e}")
                print("[KB] 切换到本地 HuggingFace Embeddings...")

        # 使用本地 HuggingFace embeddings（无需 API）
        if HF_EMBEDDINGS_AVAILABLE:
            print("[KB] 使用本地 HuggingFace Embeddings (sentence-transformers)")
            return HuggingFaceEmbeddings(
                model_name=kb_config.get("local_embedding_model", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"),
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )

        raise ImportError("无法初始化任何 Embedding 模型，请安装 langchain-openai 或 langchain-community")

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