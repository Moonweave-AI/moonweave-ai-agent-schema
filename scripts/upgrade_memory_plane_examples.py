#!/usr/bin/env python3
"""Upgrade memory-plane node.yaml example descriptions with diversified citation sources."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEMORY_PLANE = ROOT / "ontology" / "memory-plane"
SUMMARY_PATH = ROOT / "docs" / "memory-plane-example-upgrade-summary.json"

SOURCE_TAGS = [
    "Generative Agents",
    "MemGPT",
    "RAG",
    "RAPTOR",
    "Lost in the Middle",
    "HyDE",
    "ColBERT",
    "Contextual Retrieval",
    "Self-RAG",
    "Pinecone",
    "Weaviate",
    "Qdrant",
    "ChromaDB",
    "pgvector",
    "LlamaIndex",
    "Redis",
    "Cursor IDE Context",
    "Claude/Anthropic Context",
    "Mem0",
    "LangGraph",
]

KINDS = ("positive", "counterexample", "boundary", "instance")


def d(zh: str, en: str, ja: str) -> dict[str, str]:
    return {"zh": zh, "en": en, "ja": ja}


# --- Node-specific descriptions (2-3 authoritative sources each) ---
NODE_DESCRIPTIONS: dict[str, dict[str, dict[str, str]]] = {
    "MemoryStore": {
        "positive": d(
            "Generative Agents Memory Stream 按时间序 append 观察；MemGPT archival_memory_insert(content) 写入归档；Pinecone index.upsert(vectors=[(\"id1\", vec, {\"text\":...})]) serverless 持久化。",
            "Generative Agents Memory Stream appends observations chronologically; MemGPT archival_memory_insert(content) writes archival tier; Pinecone index.upsert(vectors=[(\"id1\", vec, {\"text\":...})]) on serverless index.",
            "Generative Agents Memory Stream が時系列で observation を append。MemGPT archival_memory_insert(content) が archive 層へ write。Pinecone index.upsert(vectors=[(\"id1\", vec, {\"text\":...})]) が serverless index へ永続化。",
        ),
        "counterexample": d(
            "反例：OpenAI POST /v1/embeddings 返回 1536 维向量但无 store_id/namespace/key 的 put/search 接口，不能当作 MemoryStore。",
            "Counterexample: OpenAI POST /v1/embeddings returns 1536-d vectors without store_id/namespace/key put/search APIs—not a MemoryStore.",
            "反例：OpenAI POST /v1/embeddings が 1536 次元 vector を返すが store_id/namespace/key put/search API がなく MemoryStore にならない。",
        ),
        "boundary": d(
            "MemGPT main_context（工作记忆）vs archival_memory（归档）vs recall_memory（回忆）三层边界；Generative Agents Memory Stream 不等于单次 ContextAssembly 可见输入。",
            "MemGPT main_context (working) vs archival_memory vs recall_memory tier boundary; Generative Agents Memory Stream is not one ContextAssembly visible input.",
            "MemGPT main_context（作業記憶）vs archival_memory vs recall_memory の三層境界。Generative Agents Memory Stream は一回の ContextAssembly 可視 input ではない。",
        ),
        "instance": d(
            "Qdrant client.upsert(collection_name=\"docs\", points=[PointStruct(id=1, vector=[...], payload={\"text\":...})])；ChromaDB collection.add(documents=[...], ids=[...]) 命名空间化存储实例。",
            "Qdrant client.upsert(collection_name=\"docs\", points=[PointStruct(id=1, vector=[...], payload={\"text\":...})]); ChromaDB collection.add(documents=[...], ids=[...]) namespaced store instance.",
            "Qdrant client.upsert(collection_name=\"docs\", points=[PointStruct(...)])；ChromaDB collection.add(documents=[...], ids=[...]) の namespace 化 store 実例。",
        ),
    },
    "MemoryNamespace": {
        "positive": d(
            "Pinecone index namespace=\"tenant-a\" 隔离向量；Weaviate multi-tenancy collection.with_tenant(\"org-42\")；Qdrant payload index filter 按 tenant 分区。",
            "Pinecone index namespace=\"tenant-a\" isolates vectors; Weaviate multi-tenancy collection.with_tenant(\"org-42\"); Qdrant payload index filter partitions by tenant.",
            "Pinecone index namespace=\"tenant-a\" が vector を分離。Weaviate multi-tenancy collection.with_tenant(\"org-42\")。Qdrant payload filter が tenant 分区。",
        ),
        "counterexample": d(
            "反例：ChromaDB collection 无 metadata partition 就把所有 user 记忆混在同一 collection 且无 scope 标识。",
            "Counterexample: ChromaDB collection without metadata partition mixing all user memories without scope ID.",
            "反例：ChromaDB collection が metadata partition なしで全 user 記憶を混在し scope ID なし。",
        ),
        "boundary": d(
            "MemGPT core_memory block key（如 persona）vs archival_memory 全局搜索的命名边界；Generative Agents agent_id 作用域 vs 单次对话 thread。",
            "MemGPT core_memory block key (e.g. persona) vs archival_memory global search namespace boundary; Generative Agents agent_id scope vs single-dialog thread.",
            "MemGPT core_memory block key と archival_memory 全局検索の namespace 境界。Generative Agents agent_id scope vs 単一 dialog thread。",
        ),
        "instance": d(
            "pgvector CREATE TABLE items(tenant text, embedding vector(1536)) 按 tenant 列分区；Redis FT.CREATE idx PREFIX 1 doc: 前缀命名空间。",
            "pgvector CREATE TABLE items(tenant text, embedding vector(1536)) partitioned by tenant column; Redis FT.CREATE idx PREFIX 1 doc: prefix namespace.",
            "pgvector CREATE TABLE items(tenant text, embedding vector(1536)) が tenant 列で分区。Redis FT.CREATE idx PREFIX 1 doc: 前缀 namespace。",
        ),
    },
    "VectorDatabase": {
        "positive": d(
            "Pinecone index.query(vector=[...], top_k=10, filter={\"category\":\"tech\"}) serverless；Weaviate client.collections.create(\"Article\", vectorizer_config=Configure.Vectorizer.text2vec_openai())；Qdrant client.search(collection_name=\"docs\", query_filter=Filter(...))。",
            "Pinecone index.query(vector=[...], top_k=10, filter={\"category\":\"tech\"}) serverless; Weaviate client.collections.create with text2vec_openai; Qdrant client.search with query_filter.",
            "Pinecone index.query(..., filter={\"category\":\"tech\"}) serverless。Weaviate collections.create + text2vec_openai。Qdrant client.search + query_filter。",
        ),
        "counterexample": d(
            "反例：把 OpenAI embedding API 响应当作 VectorDatabase，缺少 upsert/query/filter 端点与 connection_profile。",
            "Counterexample: treating OpenAI embedding API response as VectorDatabase without upsert/query/filter endpoints.",
            "反例：OpenAI embedding API 応答を VectorDatabase とみなし upsert/query/filter endpoint がない。",
        ),
        "boundary": d(
            "VectorDatabase 托管 VectorIndex vs EmbeddingRun 生成向量的表示边界；ColBERT index 的 token-level 存储 vs dense pgvector HNSW。",
            "VectorDatabase hosts VectorIndex vs EmbeddingRun generates vectors; ColBERT token-level index vs dense pgvector HNSW boundary.",
            "VectorDatabase が VectorIndex をホスト vs EmbeddingRun が vector 生成。ColBERT token-level index vs dense pgvector HNSW 境界。",
        ),
        "instance": d(
            "ChromaDB client.create_collection(\"docs\") + collection.query(query_texts=[\"search\"], n_results=5)；pgvector CREATE EXTENSION vector; SELECT * ORDER BY embedding <=> query LIMIT 5。",
            "ChromaDB client.create_collection(\"docs\") + collection.query(n_results=5); pgvector CREATE EXTENSION vector; SELECT * ORDER BY embedding <=> query LIMIT 5.",
            "ChromaDB create_collection + query。pgvector CREATE EXTENSION vector; ORDER BY embedding <=> query LIMIT 5。",
        ),
    },
    "MemoryWrite": {
        "positive": d(
            "MemGPT core_memory_append(key=\"persona\", content=\"...\") 追加工作记忆；archival_memory_insert(content) 写入归档；Generative Agents Memory Stream append 带 timestamp 与 importance 分数。",
            "MemGPT core_memory_append(key=\"persona\", content=\"...\") appends working memory; archival_memory_insert(content) writes archival; Generative Agents Memory Stream append with timestamp and importance score.",
            "MemGPT core_memory_append(key=\"persona\", content=\"...\") が作業記憶を append。archival_memory_insert(content) が archive へ write。Generative Agents Memory Stream が timestamp+importance 付き append。",
        ),
        "counterexample": d(
            "反例：RAG 检索到的 Document 未经过 admission 检查就当作 MemoryRecord 永久写入，无 candidate_manifest_digest。",
            "Counterexample: RAG-retrieved Document persisted as MemoryRecord without admission check or candidate_manifest_digest.",
            "反例：RAG Document が admission 検査なしで MemoryRecord として永久 write。candidate_manifest_digest なし。",
        ),
        "boundary": d(
            "MemoryWrite 初次持久化 vs ContextSummary 仅当前调用可见；MemGPT main_context 自我编辑不等于 archival_memory_insert。",
            "MemoryWrite initial persistence vs ContextSummary visible only for current call; MemGPT main_context self-edit is not archival_memory_insert.",
            "MemoryWrite 初回永続化 vs ContextSummary は現呼び出しのみ可視。MemGPT main_context 自己編集は archival_memory_insert ではない。",
        ),
        "instance": d(
            "Redis SET memory:u-42:pref EX 86400 带 TTL 写入；Pinecone upsert id=mem-42 metadata={user_id, created_at} 向量化记忆条目。",
            "Redis SET memory:u-42:pref EX 86400 with TTL write; Pinecone upsert id=mem-42 metadata={user_id, created_at} vectorized memory entry.",
            "Redis SET memory:u-42:pref EX 86400 TTL write。Pinecone upsert id=mem-42 metadata={user_id, created_at}。",
        ),
    },
    "MemoryUpdate": {
        "positive": d(
            "MemGPT core_memory_replace(key=\"persona\", old=\"...\", new=\"...\") 原地替换工作记忆块；Generative Agents 更新 Memory Stream 条目 importance 分数。",
            "MemGPT core_memory_replace(key=\"persona\", old=\"...\", new=\"...\") replaces working-memory block in place; Generative Agents updates Memory Stream entry importance score.",
            "MemGPT core_memory_replace(key=\"persona\", old=\"...\", new=\"...\") が作業記憶 block を原地置換。Generative Agents が Memory Stream entry の importance を更新。",
        ),
        "counterexample": d(
            "反例：未保留 revision 链就把 MemoryRecord 全文覆盖，丢失 Generative Agents Memory Stream 时间序 provenance。",
            "Counterexample: full MemoryRecord overwrite without revision chain, losing Generative Agents Memory Stream temporal provenance.",
            "反例：revision chain なしで MemoryRecord 全文上書き。Generative Agents Memory Stream 時間序 provenance 喪失。",
        ),
        "boundary": d(
            "MemoryUpdate 修订已有 record vs MemoryWrite 初次准入；MemGPT core_memory_replace 仅限 main_context 块。",
            "MemoryUpdate revises existing record vs MemoryWrite initial admission; MemGPT core_memory_replace limited to main_context blocks.",
            "MemoryUpdate は既存 record 改訂 vs MemoryWrite 初回 admission。MemGPT core_memory_replace は main_context block のみ。",
        ),
        "instance": d(
            "Qdrant set_payload(collection_name=\"mem\", points=[1], payload={\"text\":\"updated\"}) 更新 payload；Weaviate collection.data.update(uuid, properties={...})。",
            "Qdrant set_payload(collection_name=\"mem\", points=[1], payload={\"text\":\"updated\"}); Weaviate collection.data.update(uuid, properties={...}).",
            "Qdrant set_payload で payload 更新。Weaviate collection.data.update(uuid, properties={...})。",
        ),
    },
    "MemoryReflection": {
        "positive": d(
            "Generative Agents：importance 累计超过阈值触发 Reflection，LLM 生成高层洞察写回 Memory Stream；RAPTOR 递归摘要树顶层节点类似 consolidation 反思。",
            "Generative Agents: Reflection triggers when cumulative importance exceeds threshold; LLM generates high-level insights back to Memory Stream; RAPTOR recursive summary tree top nodes resemble consolidation reflection.",
            "Generative Agents：importance 累計が閾値超で Reflection トリガー。LLM が高层 insight を Memory Stream へ write back。RAPTOR 再帰要約 tree 顶层 node が consolidation reflection に類似。",
        ),
        "counterexample": d(
            "反例：把单次 RAG 检索摘要当作 Reflection 但未评估 importance 累计阈值或生成独立 reflection artifact。",
            "Counterexample: treating single RAG retrieval summary as Reflection without importance threshold or distinct reflection artifact.",
            "反例：一回 RAG 要約を Reflection とするが importance 累計閾値評価や独立 reflection artifact なし。",
        ),
        "boundary": d(
            "MemoryReflection 合成新洞察 vs MemoryCompaction 压缩已有内容；Generative Agents Reflection 输出仍为 Memory Stream 条目而非 ContextPackage。",
            "MemoryReflection synthesizes new insights vs MemoryCompaction compresses existing content; Generative Agents Reflection output remains Memory Stream entry not ContextPackage.",
            "MemoryReflection は新 insight 合成 vs MemoryCompaction は既存内容圧縮。Generative Agents Reflection 出力は Memory Stream entry で ContextPackage ではない。",
        ),
        "instance": d(
            "Generative Agents reflection prompt：\"Given only the memories below, generate 3 high-level questions\" → 新 insight 条目 importance=8 写回 stream。",
            "Generative Agents reflection prompt: \"Given only the memories below, generate 3 high-level questions\" → new insight entry importance=8 written to stream.",
            "Generative Agents reflection prompt で 3 つの高层 question 生成 → importance=8 の新 insight entry を stream へ write back。",
        ),
    },
    "MemoryDecay": {
        "positive": d(
            "Generative Agents 检索 score 中 recency 衰减：score=α·recency+β·importance+γ·relevance；Redis maxmemory-policy allkeys-lru 驱逐；SET key EX 3600 TTL 过期。",
            "Generative Agents retrieval recency decay in score=α·recency+β·importance+γ·relevance; Redis maxmemory-policy allkeys-lru eviction; SET key EX 3600 TTL expiration.",
            "Generative Agents 检索 score の recency 減衰：score=α·recency+β·importance+γ·relevance。Redis allkeys-lru evict。SET key EX 3600 TTL 失効。",
        ),
        "counterexample": d(
            "反例：无 recency 权重或 TTL 就把全部 Memory Stream 条目等权检索，违反 Generative Agents 时间衰减设计。",
            "Counterexample: equal-weight retrieval of all Memory Stream entries without recency weight or TTL, violating Generative Agents temporal decay design.",
            "反例：recency 重みや TTL なしで全 Memory Stream entry を等重検索。Generative Agents 時間減衰設計違反。",
        ),
        "boundary": d(
            "MemoryDecay 渐进降权 vs MemoryDelete 硬删除；Generative Agents recency 是检索分数而非存储删除。",
            "MemoryDecay gradual de-weighting vs MemoryDelete hard removal; Generative Agents recency is retrieval score not storage deletion.",
            "MemoryDecay は漸進降重 vs MemoryDelete は硬削除。Generative Agents recency は検索 score であり storage 削除ではない。",
        ),
        "instance": d(
            "Redis FT.SEARCH idx \"*=>[KNN 10 @vec $q]\" 配合 volatile-ttl 优先驱逐；Generative Agents recency=0.995^hours_since_last_access。",
            "Redis FT.SEARCH with volatile-ttl priority eviction; Generative Agents recency=0.995^hours_since_last_access.",
            "Redis FT.SEARCH + volatile-ttl 優先 evict。Generative Agents recency=0.995^hours_since_last_access。",
        ),
    },
    "MemoryConsolidation": {
        "positive": d(
            "RAPTOR：文本→分块→聚类→摘要→递归构建摘要树；叶节点与摘要节点均可检索；LlamaIndex TreeIndex 从 Document 构建层级摘要索引。",
            "RAPTOR: text→chunk→cluster→summarize→recursive summary tree; match at leaf or summary nodes; LlamaIndex TreeIndex builds hierarchical summary index from Documents.",
            "RAPTOR：text→chunk→cluster→summarize→再帰要約 tree。leaf/summary node 両方で match。LlamaIndex TreeIndex が Document から階層要約 index を構築。",
        ),
        "counterexample": d(
            "反例：简单 merge 多条 MemoryRecord 但未构建 RAPTOR 式层级摘要或保留 cluster provenance。",
            "Counterexample: simple merge of MemoryRecords without RAPTOR-style hierarchical summary or cluster provenance.",
            "反例：複数 MemoryRecord の単純 merge のみ。RAPTOR 式階層要約や cluster provenance なし。",
        ),
        "boundary": d(
            "MemoryConsolidation 合成新层级 vs MemoryCompaction 缩减体积；RAPTOR 摘要节点不等于原始 Chunk 替换。",
            "MemoryConsolidation synthesizes new hierarchy vs MemoryCompaction reduces volume; RAPTOR summary nodes do not replace original Chunks.",
            "MemoryConsolidation は新階層合成 vs MemoryCompaction は体積縮小。RAPTOR summary node は元 Chunk 置換ではない。",
        ),
        "instance": d(
            "RAPTOR clustering threshold + GPT-4 生成 cluster summary → 递归直到 root；LlamaIndex SummaryIndex.from_documents() 扁平摘要层。",
            "RAPTOR clustering threshold + GPT-4 cluster summary → recurse until root; LlamaIndex SummaryIndex.from_documents() flat summary layer.",
            "RAPTOR clustering + GPT-4 cluster summary → root まで再帰。LlamaIndex SummaryIndex.from_documents() 扁平要約層。",
        ),
    },
    "MemoryCompaction": {
        "positive": d(
            "RAPTOR 递归摘要将多叶节点压缩为上层 summary node；MemGPT 将 overflow main_context 内容 archival_memory_insert 后从工作区移除。",
            "RAPTOR recursive summarization compresses leaf nodes into upper summary nodes; MemGPT archival_memory_insert after main_context overflow then removes from working area.",
            "RAPTOR 再帰要約が leaf node を upper summary node に圧縮。MemGPT は main_context overflow 後 archival_memory_insert し作業域から除去。",
        ),
        "counterexample": d(
            "反例：Compaction 直接删除源 MemoryRecord 且无 tombstone 或 RAPTOR 上层摘要保留。",
            "Counterexample: Compaction deletes source MemoryRecords without tombstone or RAPTOR upper-summary retention.",
            "反例：Compaction が source MemoryRecord を直接 delete。tombstone や RAPTOR upper summary 保持なし。",
        ),
        "boundary": d(
            "MemoryCompaction 缩减表示 vs MemoryConsolidation 增加抽象层级；Lost in the Middle 启示 compaction 后关键信息应置于 context 首尾。",
            "MemoryCompaction reduces representation vs MemoryConsolidation adds abstraction; Lost in the Middle suggests post-compaction key info at context head/tail.",
            "MemoryCompaction は representation 縮小 vs MemoryConsolidation は抽象階層追加。Lost in the Middle は compaction 後 key info を context 首尾へ。",
        ),
        "instance": d(
            "Claude 200K window 下 Cursor 长文件部分读取策略：只加载 relevant sections 压缩 context footprint。",
            "Under Claude 200K window, Cursor long-file partial-read strategy loads only relevant sections to compress context footprint.",
            "Claude 200K window 下 Cursor 長 file 部分 read：relevant sections のみ load し context footprint を圧縮。",
        ),
    },
    "RetrievalRequest": {
        "positive": d(
            "Lewis et al. 2020 RAG：p(y|x)=Σ_z p(z|x)·p(y|x,z) 检索 z 增强生成；HyDE 先 LLM 生成假设文档再 embedding 检索；MemGPT archival_memory_search(query, page=0)。",
            "Lewis et al. 2020 RAG: p(y|x)=Σ_z p(z|x)·p(y|x,z) retrieves z to augment generation; HyDE generates hypothetical doc then embeds for retrieval; MemGPT archival_memory_search(query, page=0).",
            "Lewis et al. 2020 RAG：p(y|x)=Σ_z p(z|x)·p(y|x,z)。HyDE は仮説 document を生成後 embed 検索。MemGPT archival_memory_search(query, page=0)。",
        ),
        "counterexample": d(
            "反例：RetrievalRequest 携带 returned candidate IDs 或 similarity scores，违反 pre-execution 请求边界。",
            "Counterexample: RetrievalRequest carries returned candidate IDs or similarity scores, violating pre-execution request boundary.",
            "反例：RetrievalRequest が returned candidate ID や similarity score を含み pre-execution request 境界違反。",
        ),
        "boundary": d(
            "Self-RAG [Retrieve] token 自适应决定是否发起检索 vs 无条件 RetrievalRequest；RAG-Sequence vs RAG-Token 变体影响请求粒度。",
            "Self-RAG [Retrieve] token adaptively decides retrieval vs unconditional RetrievalRequest; RAG-Sequence vs RAG-Token variants affect request granularity.",
            "Self-RAG [Retrieve] token が adaptive に retrieval 決定 vs 無条件 RetrievalRequest。RAG-Sequence vs RAG-Token が request 粒度に影響。",
        ),
        "instance": d(
            "HyDE: query→LLM hypothetical passage→embed(hypothesis)→nearest neighbor search；ChromaDB collection.query(query_texts=[q], n_results=20) 作为候选生成请求。",
            "HyDE: query→LLM hypothetical passage→embed(hypothesis)→nearest neighbor; ChromaDB collection.query(query_texts=[q], n_results=20) as candidate-generation request.",
            "HyDE: query→LLM 仮説 passage→embed→nearest neighbor。ChromaDB collection.query(n_results=20) が candidate generation request。",
        ),
    },
    "RetrievalQuery": {
        "positive": d(
            "HyDE (Gao 2022)：LLM 生成假设文档 embedding 做 zero-shot dense retrieval；Generative Agents 用 natural-language query 检索 Memory Stream relevance 分量。",
            "HyDE (Gao 2022): LLM-generated hypothetical document embedding for zero-shot dense retrieval; Generative Agents uses natural-language query for Memory Stream relevance component.",
            "HyDE (Gao 2022)：LLM 生成仮説 document embedding で zero-shot dense retrieval。Generative Agents は natural-language query で Memory Stream relevance 成分を検索。",
        ),
        "counterexample": d(
            "反例：把 embedding 向量直接当作 RetrievalQuery 文本而未记录 query_text 与 expansion 策略。",
            "Counterexample: embedding vector used as RetrievalQuery text without query_text or expansion strategy record.",
            "反例：embedding vector を RetrievalQuery 文本として使い query_text/expansion 策略記録なし。",
        ),
        "boundary": d(
            "RetrievalQuery 自然语言 vs EmbeddingVector 数值表示；HyDE 假设文档是 query expansion 中间产物而非最终 query。",
            "RetrievalQuery natural language vs EmbeddingVector numeric representation; HyDE hypothetical doc is query-expansion intermediate not final query.",
            "RetrievalQuery 自然言語 vs EmbeddingVector 数値 representation。HyDE 仮説 document は query expansion 中間産物。",
        ),
        "instance": d(
            "Generative Agents retrieval：query=\"What is Sam's opinion on art?\" → score=α·recency+β·importance+γ·relevance 排序 top-k memories。",
            "Generative Agents retrieval: query=\"What is Sam's opinion on art?\" → score=α·recency+β·importance+γ·relevance ranks top-k memories.",
            "Generative Agents retrieval：query=\"What is Sam's opinion on art?\" → score=α·recency+β·importance+γ·relevance で top-k memories を rank。",
        ),
    },
    "RetrievalScore": {
        "positive": d(
            "Generative Agents：score=α·recency+β·importance+γ·relevance 加权检索；ColBERT MaxSim：Σ_i max_j E_qi·E_dj 晚期 token 交互分数。",
            "Generative Agents: score=α·recency+β·importance+γ·relevance weighted retrieval; ColBERT MaxSim: Σ_i max_j E_qi·E_dj late token-interaction score.",
            "Generative Agents：score=α·recency+β·importance+γ·relevance 加重検索。ColBERT MaxSim：Σ_i max_j E_qi·E_dj late token 交互 score。",
        ),
        "counterexample": d(
            "反例：Pinecone cosine similarity 未分解 recency/importance/relevance 分量就标为 Generative Agents RetrievalScore。",
            "Counterexample: Pinecone cosine similarity labeled Generative Agents RetrievalScore without recency/importance/relevance decomposition.",
            "反例：Pinecone cosine similarity を recency/importance/relevance 分解なしで Generative Agents RetrievalScore とする。",
        ),
        "boundary": d(
            "SimilarityScore（dense cosine）vs LexicalScore（BM25）vs ColBERT MaxSim（late interaction）不同分数空间；Anthropic Contextual Retrieval rerank 是第三层。",
            "SimilarityScore (dense cosine) vs LexicalScore (BM25) vs ColBERT MaxSim (late interaction) distinct score spaces; Anthropic Contextual Retrieval rerank is third layer.",
            "SimilarityScore vs LexicalScore vs ColBERT MaxSim は異なる score space。Anthropic Contextual Retrieval rerank は第三層。",
        ),
        "instance": d(
            "ColBERT index.search(query, k=10) 返回 MaxSim 分数；Weaviate hybrid alpha=0.5 融合 vector distance 与 BM25 score。",
            "ColBERT index.search(query, k=10) returns MaxSim scores; Weaviate hybrid alpha=0.5 fuses vector distance and BM25 score.",
            "ColBERT index.search(k=10) が MaxSim score を返す。Weaviate hybrid alpha=0.5 が vector distance と BM25 score を融合。",
        ),
    },
    "SimilarityScore": {
        "positive": d(
            "Pinecone index.query 返回 cosine similarity match score；pgvector SELECT ORDER BY embedding <=> '[...]' LIMIT 5 的 <=> 距离；ColBERT MaxSim 作为 multi-vector similarity。",
            "Pinecone index.query returns cosine similarity match score; pgvector SELECT ORDER BY embedding <=> query LIMIT 5 distance; ColBERT MaxSim as multi-vector similarity.",
            "Pinecone index.query が cosine similarity match score を返す。pgvector embedding <=> query 距離。ColBERT MaxSim が multi-vector similarity。",
        ),
        "counterexample": d(
            "反例：BM25 lexical score 标为 SimilarityScore 而非 LexicalScore。",
            "Counterexample: BM25 lexical score labeled SimilarityScore instead of LexicalScore.",
            "反例：BM25 lexical score を SimilarityScore とし LexicalScore ではない。",
        ),
        "boundary": d(
            "Dense cosine SimilarityScore vs ColBERT token-level MaxSim vs sparse dot-product 不同度量边界。",
            "Dense cosine SimilarityScore vs ColBERT token-level MaxSim vs sparse dot-product metric boundary.",
            "Dense cosine SimilarityScore vs ColBERT token-level MaxSim vs sparse dot-product の metric 境界。",
        ),
        "instance": d(
            "Qdrant search(query_vector=[...], limit=10) 返回 score 按 cosine；OpenAI embedding cosine 1536-dim 向量对。",
            "Qdrant search(query_vector=[...], limit=10) returns cosine score; OpenAI embedding cosine 1536-dim vector pair.",
            "Qdrant search(limit=10) が cosine score を返す。OpenAI embedding 1536-dim vector pair cosine。",
        ),
    },
    "ContextAssembly": {
        "positive": d(
            "Lewis RAG：检索文档 z 组装进 prompt p(y|x,z)；MemGPT main_context 合并 recall_memory 检索结果；Lost in the Middle：关键信息放 context 首尾。",
            "Lewis RAG: retrieved docs z assembled into prompt p(y|x,z); MemGPT main_context merges recall_memory results; Lost in the Middle: key info at context head/tail.",
            "Lewis RAG：检索 document z を prompt p(y|x,z) に assembly。MemGPT main_context が recall_memory 結果を merge。Lost in the Middle：key info を context 首尾へ。",
        ),
        "counterexample": d(
            "反例：未 trim 就把完整 MessageHistory 发送，违反 Lost in the Middle (Liu et al. 2023) U 型注意力曲线治理。",
            "Counterexample: sending full MessageHistory without trim, violating Lost in the Middle (Liu et al. 2023) U-shaped attention curve governance.",
            "反例：trim なしで MessageHistory 全量送信。Lost in the Middle (Liu et al. 2023) U 型 attention curve 治理違反。",
        ),
        "boundary": d(
            "ContextAssembly 调用前定稿包 vs 模型实际 attention；Cursor @Files 引用 vs Claude prompt caching cache_control:{type:ephemeral} 边界。",
            "ContextAssembly pre-call finalized package vs model actual attention; Cursor @Files citation vs Claude prompt caching cache_control:{type:ephemeral} boundary.",
            "ContextAssembly 呼び出し前確定 package vs model 実 attention。Cursor @Files 引用 vs Claude prompt caching cache_control 境界。",
        ),
        "instance": d(
            "Cursor @file src/auth.ts + codebase indexing 自动裁剪；Claude 200K window + cache_control:{\"type\":\"ephemeral\"} 缓存 system prompt 后 assembly。",
            "Cursor @file src/auth.ts + codebase indexing auto-trim; Claude 200K window + cache_control:{\"type\":\"ephemeral\"} caches system prompt then assembly.",
            "Cursor @file + codebase indexing auto-trim。Claude 200K + cache_control ephemeral で system prompt cache 後 assembly。",
        ),
    },
    "ContextBudget": {
        "positive": d(
            "Claude 200K token window 分配 input/output reserve；Lost in the Middle 启示：高 priority 内容占首尾 token slot；MemGPT main_context token 上限触发 archival overflow。",
            "Claude 200K token window allocates input/output reserve; Lost in the Middle: high-priority content in head/tail token slots; MemGPT main_context token limit triggers archival overflow.",
            "Claude 200K token window が input/output reserve を分配。Lost in the Middle：高 priority 内容を首尾 token slot へ。MemGPT main_context 上限で archival overflow。",
        ),
        "counterexample": d(
            "反例：ContextBudget max_tokens=200000 但无 output_reserve 导致 generation 截断。",
            "Counterexample: ContextBudget max_tokens=200000 without output_reserve causing generation truncation.",
            "反例：ContextBudget max_tokens=200000 だが output_reserve なしで generation 截断。",
        ),
        "boundary": d(
            "ContextBudget 计划分配 vs VisibleContextWindow 实际投影；Anthropic prompt caching 缓存 token 不计入 mutable budget。",
            "ContextBudget planned allocation vs VisibleContextWindow actual projection; Anthropic prompt caching cached tokens excluded from mutable budget.",
            "ContextBudget 計画分配 vs VisibleContextWindow 実投影。Anthropic prompt caching 缓存 token は mutable budget 外。",
        ),
        "instance": d(
            "Cursor context 裁剪：max_context_tokens=128k 保留最近文件引用 + 摘要中间历史；Claude API max_tokens=4096 output reserve。",
            "Cursor context trim: max_context_tokens=128k keeps recent file refs + summarized middle history; Claude API max_tokens=4096 output reserve.",
            "Cursor context trim：max_context_tokens=128k で最近 file 引用+要約中間 history。Claude max_tokens=4096 output reserve。",
        ),
    },
    "ContextWindow": {
        "positive": d(
            "Claude 200K context window；MemGPT main_context 工作记忆窗口；Lost in the Middle：LLM 对中间位置信息利用率显著下降（U 型曲线）。",
            "Claude 200K context window; MemGPT main_context working-memory window; Lost in the Middle: LLM utilization drops for middle-position info (U-curve).",
            "Claude 200K context window。MemGPT main_context 作業記憶 window。Lost in the Middle：中間位置 info 利用率が U 型 curve で低下。",
        ),
        "counterexample": d(
            "反例：ContextWindow max_tokens 未绑定具体 model window（如 Claude 200K vs GPT-4 128K）。",
            "Counterexample: ContextWindow max_tokens not bound to concrete model window (Claude 200K vs GPT-4 128K).",
            "反例：ContextWindow max_tokens が具体 model window（Claude 200K vs GPT-4 128K）に未绑定。",
        ),
        "boundary": d(
            "ContextWindow 容量声明 vs ContextPackage 实际内容；Cursor 部分读取长文件不等于完整 file window。",
            "ContextWindow capacity declaration vs ContextPackage actual content; Cursor partial long-file read is not full file window.",
            "ContextWindow 容量宣言 vs ContextPackage 実内容。Cursor 長 file 部分 read は完全 file window ではない。",
        ),
        "instance": d(
            "Anthropic messages API 200K input limit；MemGPT main_context 固定 token budget ~8K 超出触发 paging to archival。",
            "Anthropic messages API 200K input limit; MemGPT main_context fixed ~8K token budget overflow triggers paging to archival.",
            "Anthropic messages API 200K input limit。MemGPT main_context ~8K token budget 超過で archival へ paging。",
        ),
    },
    "ContextTrimmingActivity": {
        "positive": d(
            "Lost in the Middle (Liu et al. 2023)：裁剪中间低 priority 消息保留首尾；MemGPT 将 overflow main_context 内容移入 archival；Cursor 长文件部分读取。",
            "Lost in the Middle (Liu et al. 2023): trim middle low-priority messages keep head/tail; MemGPT moves overflow main_context to archival; Cursor partial long-file read.",
            "Lost in the Middle：中間 low priority message を trim し首尾保持。MemGPT overflow main_context→archival。Cursor 長 file 部分 read。",
        ),
        "counterexample": d(
            "反例：trim 删除 system prompt 或最近 user message，破坏 RAG context 完整性。",
            "Counterexample: trim removes system prompt or latest user message, breaking RAG context integrity.",
            "反例：trim が system prompt や最新 user message を削除し RAG context 完整性を破壊。",
        ),
        "boundary": d(
            "ContextTrimmingActivity 裁剪 vs ContextSummary 摘要替代；二者可组合但产生不同 artifact。",
            "ContextTrimmingActivity trimming vs ContextSummary summarization replacement; combinable but produce different artifacts.",
            "ContextTrimmingActivity trim vs ContextSummary 要約置換。組み合わせ可能だが異なる artifact を生成。",
        ),
        "instance": d(
            "Lost in the Middle 策略：保留 first 2 + last 8 messages，中间 40 条摘要为 1 条 ContextSummary slot。",
            "Lost in the Middle strategy: keep first 2 + last 8 messages, summarize middle 40 into one ContextSummary slot.",
            "Lost in the Middle 策略：first 2 + last 8 message 保持、中間 40 件を 1 ContextSummary slot に要約。",
        ),
    },
    "ContextOrderingActivity": {
        "positive": d(
            "Lost in the Middle：高 relevance 检索文档放 prompt 首尾；RAG p(y|x,z) 将检索 z 插入 system/user 边界；Cursor @ 引用按相关性排序。",
            "Lost in the Middle: high-relevance retrieved docs at prompt head/tail; RAG p(y|x,z) inserts retrieved z at system/user boundary; Cursor @ citations sorted by relevance.",
            "Lost in the Middle：高 relevance 检索 document を prompt 首尾へ。RAG p(y|x,z) が检索 z を system/user 境界に insert。Cursor @ 引用を relevance 順。",
        ),
        "counterexample": d(
            "反例：RetrievalResult 候选按 raw similarity 降序全部置于 context 中间段。",
            "Counterexample: RetrievalResult candidates by raw similarity descending all placed in context middle section.",
            "反例：RetrievalResult candidate を raw similarity 降順で全て context 中間段に配置。",
        ),
        "boundary": d(
            "ContextOrderingRule 策略 vs ContextOrderingActivity 执行；Generative Agents 按 score 排序不等于 Lost in the Middle 位置优化。",
            "ContextOrderingRule policy vs ContextOrderingActivity execution; Generative Agents score ordering is not Lost in the Middle position optimization.",
            "ContextOrderingRule 方針 vs ContextOrderingActivity 実行。Generative Agents score 排序は Lost in the Middle 位置最適化ではない。",
        ),
        "instance": d(
            "RAG assembly：system prompt → top-3 retrieved docs (head) → user query → recent 4 messages (tail)。",
            "RAG assembly: system prompt → top-3 retrieved docs (head) → user query → recent 4 messages (tail).",
            "RAG assembly：system prompt → top-3 retrieved docs (head) → user query → recent 4 messages (tail)。",
        ),
    },
    "SituatedChunk": {
        "positive": d(
            "Anthropic Contextual Retrieval (2024)：Claude 为每 chunk 生成 50-100 token 语境前缀；Contextual Embeddings + Contextual BM25 配合 rerank 降失败率 67%。",
            "Anthropic Contextual Retrieval (2024): Claude generates 50-100 token context prefix per chunk; Contextual Embeddings + Contextual BM25 with rerank reduces failure rate 67%.",
            "Anthropic Contextual Retrieval (2024)：Claude が各 chunk に 50-100 token 文脈 prefix を生成。Contextual Embeddings + BM25 + rerank で失敗率 67% 低下。",
        ),
        "counterexample": d(
            "反例：语境前缀覆盖 Chunk 原始正文且未保留 ChunkProvenance 与独立 situated_chunk_id。",
            "Counterexample: context prefix overwrites Chunk original body without ChunkProvenance or distinct situated_chunk_id.",
            "反例：文脈 prefix が Chunk 元 body を上書き。ChunkProvenance/独立 situated_chunk_id なし。",
        ),
        "boundary": d(
            "SituatedChunk 前缀+正文 vs 原始 Chunk；EmbeddingRun 应 embed situated text 而非 raw chunk。",
            "SituatedChunk prefix+body vs original Chunk; EmbeddingRun should embed situated text not raw chunk.",
            "SituatedChunk prefix+body vs 原始 Chunk。EmbeddingRun は situated text を embed すべきで raw chunk ではない。",
        ),
        "instance": d(
            "Anthropic cookbook：contextualize_prompt(chunk, doc) → prepend prefix → text-embedding-3-small embed → Pinecone upsert。",
            "Anthropic cookbook: contextualize_prompt(chunk, doc) → prepend prefix → text-embedding-3-small embed → Pinecone upsert.",
            "Anthropic cookbook：contextualize_prompt → prepend prefix → text-embedding-3-small embed → Pinecone upsert。",
        ),
    },
    "Chunk": {
        "positive": d(
            "RAPTOR 叶节点分块；LlamaIndex SentenceSplitter；Anthropic Contextual Retrieval 分块后加语境前缀生成 SituatedChunk。",
            "RAPTOR leaf-node chunking; LlamaIndex SentenceSplitter; Anthropic Contextual Retrieval chunks then adds context prefix as SituatedChunk.",
            "RAPTOR leaf node chunking。LlamaIndex SentenceSplitter。Anthropic Contextual Retrieval が chunk 後に文脈 prefix で SituatedChunk 生成。",
        ),
        "counterexample": d(
            "反例：整篇 Document 未分块直接 upsert Pinecone，缺少 chunk_id 与 offset metadata。",
            "Counterexample: whole Document upserted to Pinecone without chunking, missing chunk_id and offset metadata.",
            "反例：Document 全文を chunk なし Pinecone upsert。chunk_id/offset metadata 欠如。",
        ),
        "boundary": d(
            "Chunk 分割工件 vs Document 原始资源；RAPTOR 内部 chunk 可进一步聚类摘要。",
            "Chunk split artifact vs Document source resource; RAPTOR internal chunks can cluster into summaries.",
            "Chunk 分割 artifact vs Document 原始 resource。RAPTOR 内部 chunk は cluster 要約可能。",
        ),
        "instance": d(
            "RecursiveCharacterTextSplitter(chunk_size=512, overlap=64) → chunk_id=c-42 offset=1024 len=512 source=policy.pdf。",
            "RecursiveCharacterTextSplitter(chunk_size=512, overlap=64) → chunk_id=c-42 offset=1024 len=512 source=policy.pdf.",
            "RecursiveCharacterTextSplitter(chunk_size=512, overlap=64) → chunk_id=c-42 offset=1024 len=512 source=policy.pdf。",
        ),
    },
    "VectorIndex": {
        "positive": d(
            "Pinecone index.upsert(vectors=[(\"id1\", [0.1,...], {\"text\":...})]) serverless；Weaviate near_text hybrid；Qdrant HNSW collection；pgvector CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)。",
            "Pinecone index.upsert serverless; Weaviate near_text hybrid; Qdrant HNSW collection; pgvector CREATE INDEX USING hnsw (embedding vector_cosine_ops).",
            "Pinecone index.upsert serverless。Weaviate near_text hybrid。Qdrant HNSW collection。pgvector hnsw index。",
        ),
        "counterexample": d(
            "反例：Pinecone match score 标为 SimilarityScore 但未记录 embedding model/dimensions 与 IndexVersion。",
            "Counterexample: Pinecone match score as SimilarityScore without embedding model/dimensions and IndexVersion.",
            "反例：Pinecone match score を SimilarityScore とし embedding model/dimensions/IndexVersion 記録なし。",
        ),
        "boundary": d(
            "ColBERT MaxSim token-level index vs dense VectorIndex cosine；HybridIndex 融合不同分数空间。",
            "ColBERT MaxSim token-level index vs dense VectorIndex cosine; HybridIndex fuses distinct score spaces.",
            "ColBERT MaxSim token-level index vs dense VectorIndex cosine。HybridIndex が異なる score space を融合。",
        ),
        "instance": d(
            "pgvector SELECT * FROM items ORDER BY embedding <=> '[0.1,0.2,...]' LIMIT 5；Redis FT.CREATE idx VECTOR HNSW 6 TYPE FLOAT32 DIM 1536。",
            "pgvector SELECT * ORDER BY embedding <=> query LIMIT 5; Redis FT.CREATE idx VECTOR HNSW 6 TYPE FLOAT32 DIM 1536.",
            "pgvector ORDER BY embedding <=> query LIMIT 5。Redis FT.CREATE VECTOR HNSW DIM 1536。",
        ),
    },
    "HybridIndex": {
        "positive": d(
            "Weaviate hybrid query near_text + BM25 fusionType=RelativeScoreFusion；Anthropic Contextual Embeddings + Contextual BM25 双路检索；Pinecone hybrid alpha=0.5。",
            "Weaviate hybrid near_text + BM25 fusionType=RelativeScoreFusion; Anthropic Contextual Embeddings + Contextual BM25 dual retrieval; Pinecone hybrid alpha=0.5.",
            "Weaviate hybrid + BM25 RelativeScoreFusion。Anthropic Contextual Embeddings + Contextual BM25 双路检索。Pinecone hybrid alpha=0.5。",
        ),
        "counterexample": d(
            "反例：仅 dense VectorIndex 却声明 hybrid 但未配置 sparse/BM25 分量。",
            "Counterexample: dense-only VectorIndex declared hybrid without sparse/BM25 component.",
            "反例：dense VectorIndex のみで hybrid 宣言だが sparse/BM25 成分未設定。",
        ),
        "boundary": d(
            "HybridIndex 融合 dense+sparse vs TfIdfIndex 纯 lexical；RankFusion RRF 在 RetrievalActivity 层非 Index 层。",
            "HybridIndex fuses dense+sparse vs TfIdfIndex pure lexical; RankFusion RRF at RetrievalActivity layer not Index layer.",
            "HybridIndex dense+sparse 融合 vs TfIdfIndex 純 lexical。RankFusion RRF は RetrievalActivity 層で Index 層ではない。",
        ),
        "instance": d(
            "Weaviate collection.query.hybrid(query=\"AI agents\", alpha=0.5, limit=10, filters=Filter.by_property(\"year\").greater_than(2023))。",
            "Weaviate collection.query.hybrid(query=\"AI agents\", alpha=0.5, limit=10, filters=Filter.by_property(\"year\").greater_than(2023)).",
            "Weaviate hybrid(query=\"AI agents\", alpha=0.5, limit=10, filters year>2023)。",
        ),
    },
    "RerankActivity": {
        "positive": d(
            "Anthropic Contextual Retrieval：top-20 候选 + rerank 降检索失败率 67%；ColBERT rerank 用 MaxSim 重排；Self-RAG [IsRel] token 过滤不相关文档。",
            "Anthropic Contextual Retrieval: top-20 candidates + rerank reduces failure 67%; ColBERT rerank via MaxSim; Self-RAG [IsRel] token filters irrelevant docs.",
            "Anthropic Contextual Retrieval：top-20 + rerank で失敗率 67% 低下。ColBERT MaxSim rerank。Self-RAG [IsRel] token が irrelevant doc を filter。",
        ),
        "counterexample": d(
            "反例：rerank 输入超过 100 文档且无 TopKSelection 预过滤。",
            "Counterexample: rerank input exceeds 100 documents without TopKSelection pre-filter.",
            "反例：rerank 入力が 100 doc 超で TopKSelection 事前 filter なし。",
        ),
        "boundary": d(
            "RerankActivity 重排 vs CandidateScoringActivity 初评；RerankScore 与 SimilarityScore 不同分数类型。",
            "RerankActivity reranking vs CandidateScoringActivity initial scoring; RerankScore differs from SimilarityScore.",
            "RerankActivity rerank vs CandidateScoringActivity 初評。RerankScore は SimilarityScore と異なる score 型。",
        ),
        "instance": d(
            "Anthropic pipeline：BM25 top-150 ∩ embedding top-150 → union top-20 → rerank → top-5 for context assembly。",
            "Anthropic pipeline: BM25 top-150 ∩ embedding top-150 → union top-20 → rerank → top-5 for context assembly.",
            "Anthropic pipeline：BM25 top-150 ∩ embedding top-150 → union top-20 → rerank → top-5 for context assembly。",
        ),
    },
    "RetrievalRun": {
        "positive": d(
            "Self-RAG：模型输出 [Retrieve] 触发检索 → [IsRel]/[IsSup]/[IsUse] 评判；RAG retrieve-then-read p(z|x)；Generative Agents score 加权 top-k Memory Stream。",
            "Self-RAG: [Retrieve] triggers retrieval → [IsRel]/[IsSup]/[IsUse] critique; RAG retrieve-then-read p(z|x); Generative Agents score-weighted top-k Memory Stream.",
            "Self-RAG：[Retrieve]→retrieval→[IsRel]/[IsSup]/[IsUse] 評価。RAG p(z|x)。Generative Agents score 加重 top-k Memory Stream。",
        ),
        "counterexample": d(
            "反例：RetrievalRun 无 retrieval_scope_id 或 completed_at 的半成品执行记录。",
            "Counterexample: RetrievalRun missing retrieval_scope_id or completed_at incomplete execution record.",
            "反例：RetrievalRun に retrieval_scope_id や completed_at なしの未完成実行記録。",
        ),
        "boundary": d(
            "RetrievalRun 在线查询 vs IndexBuildRun 离线索引构建；HyDE 在 CandidateGenerationActivity 层生成假设文档。",
            "RetrievalRun online query vs IndexBuildRun offline index build; HyDE generates hypothetical doc at CandidateGenerationActivity layer.",
            "RetrievalRun online query vs IndexBuildRun offline index build。HyDE は CandidateGenerationActivity 層で仮説 document 生成。",
        ),
        "instance": d(
            "MemGPT archival_memory_search(query=\"project notes\", page=0, page_size=10) 分页检索 run；ChromaDB collection.query n_results=10 实例。",
            "MemGPT archival_memory_search(query=\"project notes\", page=0, page_size=10) paginated retrieval run; ChromaDB collection.query n_results=10 instance.",
            "MemGPT archival_memory_search(page=0, page_size=10) 分页 retrieval run。ChromaDB collection.query n_results=10 実例。",
        ),
    },
    "MemoryScope": {
        "positive": d(
            "Generative Agents agent-scoped Memory Stream；MemGPT per-user archival/recall 分区；Pinecone namespace + metadata filter 限定检索域。",
            "Generative Agents agent-scoped Memory Stream; MemGPT per-user archival/recall partition; Pinecone namespace + metadata filter bounds retrieval domain.",
            "Generative Agents agent-scoped Memory Stream。MemGPT per-user archival/recall 分区。Pinecone namespace + metadata filter で検索域限定。",
        ),
        "counterexample": d(
            "反例：跨 tenant 检索无 scope_id 约束，违反 multi-tenancy 隔离。",
            "Counterexample: cross-tenant retrieval without scope_id constraint, violating multi-tenancy isolation.",
            "反例：scope_id 制約なし cross-tenant 検索。multi-tenancy 分離違反。",
        ),
        "boundary": d(
            "MemoryScope 逻辑分区 vs MemoryNamespace 物理寻址；Weaviate tenant vs collection 层级。",
            "MemoryScope logical partition vs MemoryNamespace physical addressing; Weaviate tenant vs collection hierarchy.",
            "MemoryScope 論理分区 vs MemoryNamespace 物理 addressing。Weaviate tenant vs collection 階層。",
        ),
        "instance": d(
            "Qdrant Filter(must=[FieldCondition(key=\"user_id\", match=MatchValue(value=\"u-42\"))]) 限定 scope-memory-042。",
            "Qdrant Filter(must=[FieldCondition(key=\"user_id\", match=MatchValue(value=\"u-42\"))]) bounds scope-memory-042.",
            "Qdrant Filter(user_id=\"u-42\") が scope-memory-042 を限定。",
        ),
    },
    "MemoryRecord": {
        "positive": d(
            "Generative Agents Memory Stream 条目：timestamp + natural language observation + importance score；MemGPT archival entry；Pinecone upsert metadata={text, created_at}。",
            "Generative Agents Memory Stream entry: timestamp + natural language observation + importance score; MemGPT archival entry; Pinecone upsert metadata={text, created_at}.",
            "Generative Agents Memory Stream entry：timestamp + observation + importance score。MemGPT archival entry。Pinecone upsert metadata={text, created_at}。",
        ),
        "counterexample": d(
            "反例：EmbeddingVector 1536-d float 数组当作 MemoryRecord 内容项。",
            "Counterexample: EmbeddingVector 1536-d float array treated as MemoryRecord content item.",
            "反例：EmbeddingVector 1536-d float 配列を MemoryRecord 内容 item とする。",
        ),
        "boundary": d(
            "MemoryRecord 持久内容 vs RetrievedCandidate 检索候选；RAG 文档 z 检索结果不等于已写入 MemoryRecord。",
            "MemoryRecord persistent content vs RetrievedCandidate retrieval candidate; RAG document z retrieval result is not written MemoryRecord.",
            "MemoryRecord 永続内容 vs RetrievedCandidate 検索候補。RAG document z 検索結果は書込済 MemoryRecord ではない。",
        ),
        "instance": d(
            "Generative Agents: \"Sam Khan is working on a poetry project\" importance=7 timestamp=2023-02-14 10:00 stored in stream。",
            "Generative Agents: \"Sam Khan is working on a poetry project\" importance=7 timestamp=2023-02-14 10:00 stored in stream.",
            "Generative Agents：\"Sam Khan is working on a poetry project\" importance=7 timestamp=2023-02-14 10:00 stream 保存。",
        ),
    },
}

# --- Pattern fallbacks (regex on node_id) ---
PATTERN_DESCRIPTIONS: list[tuple[str, dict[str, dict[str, str]]]] = [
    (
        r"^Context",
        {
            "positive": d(
                "Cursor @Files/@Code 引用 + codebase indexing 自动裁剪；Claude 200K window + cache_control:{type:ephemeral}；Lost in the Middle 首尾优先排序。",
                "Cursor @Files/@Code citation + codebase indexing auto-trim; Claude 200K window + cache_control:{type:ephemeral}; Lost in the Middle head/tail priority ordering.",
                "Cursor @Files/@Code 引用 + codebase indexing auto-trim。Claude 200K + cache_control ephemeral。Lost in the Middle 首尾優先 ordering。",
            ),
            "counterexample": d(
                "反例：未 budget/trim 全量 MessageHistory 送入模型，违反 Lost in the Middle (Liu et al. 2023) U 型曲线。",
                "Counterexample: full MessageHistory to model without budget/trim, violating Lost in the Middle (Liu et al. 2023) U-curve.",
                "反例：budget/trim なし MessageHistory 全量を model へ。Lost in the Middle U 型 curve 違反。",
            ),
            "boundary": d(
                "Claude prompt caching 缓存 token vs mutable context 边界；Cursor 部分 file read vs 完整 Document 边界。",
                "Claude prompt caching cached tokens vs mutable context boundary; Cursor partial file read vs full Document boundary.",
                "Claude prompt caching 缓存 token vs mutable context 境界。Cursor 部分 file read vs 完全 Document 境界。",
            ),
            "instance": d(
                "RAG ContextAssembly：system → retrieved docs (head) → user query → recent messages (tail)；MemGPT main_context merge recall results。",
                "RAG ContextAssembly: system → retrieved docs (head) → user query → recent messages (tail); MemGPT main_context merges recall results.",
                "RAG ContextAssembly：system→retrieved docs(head)→user query→recent messages(tail)。MemGPT main_context merge recall results。",
            ),
        },
    ),
    (
        r"^Chunk|^Situated|^Situating",
        {
            "positive": d(
                "Anthropic Contextual Retrieval：50-100 token 语境前缀 + Contextual BM25；RAPTOR 叶节点分块；LlamaIndex SentenceSplitter node parser。",
                "Anthropic Contextual Retrieval: 50-100 token context prefix + Contextual BM25; RAPTOR leaf chunking; LlamaIndex SentenceSplitter node parser.",
                "Anthropic Contextual Retrieval：50-100 token 文脈 prefix + Contextual BM25。RAPTOR leaf chunking。LlamaIndex SentenceSplitter。",
            ),
            "counterexample": d(
                "反例：语境前缀覆盖 Chunk 正文且无 ChunkProvenance 与独立 SituatedChunk ID。",
                "Counterexample: context prefix overwrites Chunk body without ChunkProvenance or distinct SituatedChunk ID.",
                "反例：文脈 prefix が Chunk body 上書き。ChunkProvenance/独立 SituatedChunk ID なし。",
            ),
            "boundary": d(
                "ChunkingRun 产出 Chunk vs EmbeddingRun 读取 Chunk 生成向量（memory-embedding-indexes 模块）。",
                "ChunkingRun produces Chunk vs EmbeddingRun reads Chunk for vectors (memory-embedding-indexes module).",
                "ChunkingRun が Chunk 生成 vs EmbeddingRun が Chunk read して vector 生成（memory-embedding-indexes）。",
            ),
            "instance": d(
                "Anthropic cookbook contextualize_prompt → prepend → text-embedding-3-small → Pinecone upsert situated vector。",
                "Anthropic cookbook contextualize_prompt → prepend → text-embedding-3-small → Pinecone upsert situated vector.",
                "Anthropic cookbook contextualize_prompt→prepend→text-embedding-3-small→Pinecone upsert situated vector。",
            ),
        },
    ),
    (
        r"^Index|^Embedding|^Vector|^Dense|^Sparse|^TfIdf|^Hybrid|^Representation|^GraphEmbedding|^TextEmbedding",
        {
            "positive": d(
                "Pinecone index.upsert/query + metadata filter；Weaviate collections + hybrid search；Qdrant PointStruct upsert/search；pgvector <=> operator；ColBERT MaxSim。",
                "Pinecone index.upsert/query + metadata filter; Weaviate collections + hybrid search; Qdrant PointStruct upsert/search; pgvector <=> operator; ColBERT MaxSim.",
                "Pinecone upsert/query + metadata filter。Weaviate hybrid。Qdrant upsert/search。pgvector <=>。ColBERT MaxSim。",
            ),
            "counterexample": d(
                "反例：match score 标为 SimilarityScore 但未记录 embedding model/dimensions/IndexVersion。",
                "Counterexample: match score as SimilarityScore without embedding model/dimensions/IndexVersion.",
                "反例：match score を SimilarityScore とし embedding model/dimensions/IndexVersion 記録なし。",
            ),
            "boundary": d(
                "ColBERT late-interaction token vectors vs dense cosine VectorIndex；Redis FT.CREATE VECTOR HNSW vs managed Pinecone serverless。",
                "ColBERT late-interaction token vectors vs dense cosine VectorIndex; Redis FT.CREATE VECTOR HNSW vs managed Pinecone serverless.",
                "ColBERT late-interaction vs dense cosine VectorIndex。Redis VECTOR HNSW vs Pinecone serverless。",
            ),
            "instance": d(
                "ChromaDB collection.add + query；Redis FT.SEARCH \"*=>[KNN 10 @vec $q]\" PARAMS 2 query_vec bytes。",
                "ChromaDB collection.add + query; Redis FT.SEARCH \"*=>[KNN 10 @vec $q]\" PARAMS 2 query_vec bytes.",
                "ChromaDB add + query。Redis FT.SEARCH KNN 10 @vec。",
            ),
        },
    ),
    (
        r"^Retriev|^Rank|^Candidate|^Similarity|^Lexical|^Rerank|^TopK",
        {
            "positive": d(
                "Lewis RAG p(y|x)=Σ_z p(z|x)·p(y|x,z)；HyDE 假设文档 embedding；RAPTOR 树检索；Self-RAG [Retrieve] adaptive；Generative Agents score=α·recency+β·importance+γ·relevance。",
                "Lewis RAG p(y|x)=Σ_z p(z|x)·p(y|x,z); HyDE hypothetical doc embedding; RAPTOR tree retrieval; Self-RAG [Retrieve] adaptive; Generative Agents score=α·recency+β·importance+γ·relevance.",
                "Lewis RAG p(y|x,z)。HyDE 仮説 doc embedding。RAPTOR tree retrieval。Self-RAG [Retrieve]。Generative Agents score 公式。",
            ),
            "counterexample": d(
                "反例：RetrievalResult 候选无 TopKSelection/token budget 直接全量进 ContextPackage。",
                "Counterexample: RetrievalResult candidates enter ContextPackage without TopKSelection/token budget.",
                "反例：RetrievalResult candidate が TopKSelection/token budget なしで ContextPackage 全量進入。",
            ),
            "boundary": d(
                "IndexBuildRun 离线索引 vs RetrievalRun 在线查询；RAG-Sequence vs RAG-Token 变体边界。",
                "IndexBuildRun offline index vs RetrievalRun online query; RAG-Sequence vs RAG-Token variant boundary.",
                "IndexBuildRun offline index vs RetrievalRun online query。RAG-Sequence vs RAG-Token 境界。",
            ),
            "instance": d(
                "pgvector ORDER BY embedding <=> query LIMIT 20；Anthropic Contextual Retrieval top-20 + rerank → top-5 context。",
                "pgvector ORDER BY embedding <=> query LIMIT 20; Anthropic Contextual Retrieval top-20 + rerank → top-5 context.",
                "pgvector <=> LIMIT 20。Anthropic Contextual Retrieval top-20 + rerank → top-5 context。",
            ),
        },
    ),
    (
        r"^Ingest|^Document|^File|^Directory|^Database|^Graph|^Text|^Deduplication|^Normalization|^Source",
        {
            "positive": d(
                "LlamaIndex SimpleDirectoryReader + VectorStoreIndex.from_documents；KnowledgeGraphIndex；LangChain PyPDFLoader Document(page_content, metadata)。",
                "LlamaIndex SimpleDirectoryReader + VectorStoreIndex.from_documents; KnowledgeGraphIndex; LangChain PyPDFLoader Document(page_content, metadata).",
                "LlamaIndex SimpleDirectoryReader + VectorStoreIndex.from_documents。KnowledgeGraphIndex。LangChain PyPDFLoader Document。",
            ),
            "counterexample": d(
                "反例：DocumentLoader 输出无 DocumentMetadata source/page 就进入 EmbeddingRun，丢失 ChunkProvenance。",
                "Counterexample: DocumentLoader output enters EmbeddingRun without DocumentMetadata source/page, losing ChunkProvenance.",
                "反例：DocumentLoader 出力が DocumentMetadata source/page なしで EmbeddingRun へ。ChunkProvenance 喪失。",
            ),
            "boundary": d(
                "IngestionRun 产出 Document vs ChunkingRun 分割；GraphStore node/edge vs TextCorpus 资源类型边界。",
                "IngestionRun produces Document vs ChunkingRun splits; GraphStore node/edge vs TextCorpus resource type boundary.",
                "IngestionRun Document 生成 vs ChunkingRun 分割。GraphStore vs TextCorpus resource 境界。",
            ),
            "instance": d(
                "LlamaIndex PDFReader load_data → Document list metadata file_name/page_label → downstream RAPTOR chunking。",
                "LlamaIndex PDFReader load_data → Document list metadata file_name/page_label → downstream RAPTOR chunking.",
                "LlamaIndex PDFReader → Document list metadata → downstream RAPTOR chunking。",
            ),
        },
    ),
    (
        r"^Memory",
        {
            "positive": d(
                "Generative Agents Memory Stream + Reflection；MemGPT core_memory_append/archival_memory_insert；Redis SET EX TTL + FT.SEARCH vector eviction。",
                "Generative Agents Memory Stream + Reflection; MemGPT core_memory_append/archival_memory_insert; Redis SET EX TTL + FT.SEARCH vector eviction.",
                "Generative Agents Memory Stream + Reflection。MemGPT core_memory_append/archival_memory_insert。Redis SET EX TTL + vector eviction。",
            ),
            "counterexample": d(
                "反例：ephemeral tool output 无 MemoryRetentionPolicy/Redis EX TTL 就永久 MemoryWrite。",
                "Counterexample: ephemeral tool output MemoryWrite permanently without MemoryRetentionPolicy/Redis EX TTL.",
                "反例：ephemeral tool output が MemoryRetentionPolicy/Redis EX TTL なしで永久 MemoryWrite。",
            ),
            "boundary": d(
                "MemGPT main_context vs archival vs recall 生命周期阶段；Generative Agents importance 累计 vs MemoryDecay recency 衰减。",
                "MemGPT main_context vs archival vs recall lifecycle stages; Generative Agents importance accumulation vs MemoryDecay recency decay.",
                "MemGPT main/recall/archival lifecycle 段階。Generative Agents importance 累計 vs MemoryDecay recency 減衰。",
            ),
            "instance": d(
                "MemGPT core_memory_replace(key=\"human\", old=\"Bob\", new=\"Alice\")；Generative Agents reflection importance threshold=150 触发。",
                "MemGPT core_memory_replace(key=\"human\", old=\"Bob\", new=\"Alice\"); Generative Agents reflection importance threshold=150 triggers.",
                "MemGPT core_memory_replace(key=\"human\")。Generative Agents reflection importance threshold=150 トリガー。",
            ),
        },
    ),
]

# --- Module fallbacks ---
MODULE_FALLBACKS: dict[str, dict[str, dict[str, str]]] = {
    "memory-stores-scopes": {
        "positive": d(
            "Generative Agents Memory Stream 时序存储；MemGPT archival/recall 分层；Pinecone/Qdrant/ChromaDB/pgvector 向量存储后端。",
            "Generative Agents Memory Stream temporal store; MemGPT archival/recall tiers; Pinecone/Qdrant/ChromaDB/pgvector vector backends.",
            "Generative Agents Memory Stream 時系列 store。MemGPT archival/recall 階層。Pinecone/Qdrant/ChromaDB/pgvector backend。",
        ),
        "counterexample": d(
            "反例：OpenAI embedding 响应或 MessageHistory checkpoint 误标为 MemoryStore/MemoryRecord。",
            "Counterexample: OpenAI embedding response or MessageHistory checkpoint mislabeled as MemoryStore/MemoryRecord.",
            "反例：OpenAI embedding 応答や MessageHistory checkpoint を MemoryStore/MemoryRecord と誤ラベル。",
        ),
        "boundary": d(
            "MemGPT 三层记忆 vs Claude 200K context window 运行时输入；存储设施 vs 模型可见 context 边界。",
            "MemGPT three-tier memory vs Claude 200K context window runtime input; storage facility vs model-visible context boundary.",
            "MemGPT 三層記憶 vs Claude 200K context window runtime input。storage facility vs model 可視 context 境界。",
        ),
        "instance": d(
            "Pinecone namespace=\"users/alice\" upsert；Weaviate multi-tenant collection；Redis HASH doc: + VECTOR index。",
            "Pinecone namespace=\"users/alice\" upsert; Weaviate multi-tenant collection; Redis HASH doc: + VECTOR index.",
            "Pinecone namespace upsert。Weaviate multi-tenant collection。Redis HASH + VECTOR index。",
        ),
    },
    "memory-context": PATTERN_DESCRIPTIONS[0][1],
    "memory-chunking-situating": PATTERN_DESCRIPTIONS[1][1],
    "memory-embedding-indexes": PATTERN_DESCRIPTIONS[2][1],
    "memory-retrieval-ranking": PATTERN_DESCRIPTIONS[3][1],
    "memory-ingestion": PATTERN_DESCRIPTIONS[4][1],
    "memory-lifecycle": PATTERN_DESCRIPTIONS[5][1],
}

PLANE_FALLBACK = {
    "positive": d(
        "memory-plane 涵盖 Generative Agents Memory Stream、MemGPT 虚拟上下文、RAG/RAPTOR/HyDE/Self-RAG 检索、Pinecone/Weaviate/Qdrant 向量存储与 Claude/Cursor 上下文工程。",
        "memory-plane spans Generative Agents Memory Stream, MemGPT virtual context, RAG/RAPTOR/HyDE/Self-RAG retrieval, Pinecone/Weaviate/Qdrant vector stores, and Claude/Cursor context engineering.",
        "memory-plane は Generative Agents Memory Stream、MemGPT virtual context、RAG/RAPTOR/HyDE/Self-RAG、Pinecone/Weaviate/Qdrant、Claude/Cursor context engineering を涵盖。",
    ),
    "counterexample": d(
        "反例：违反权威 memory/RAG 论文或向量 DB API 契约的持久化/检索建模。",
        "Counterexample: persistence/retrieval modeling violating authoritative memory/RAG papers or vector DB API contracts.",
        "反例：権威 memory/RAG 論文や vector DB API 契約に違反する永続化/検索モデリング。",
    ),
    "boundary": d(
        "MemGPT main_context vs archival vs Generative Agents Memory Stream vs Claude context window 的域边界。",
        "Domain boundary among MemGPT main_context, archival, Generative Agents Memory Stream, and Claude context window.",
        "MemGPT main_context vs archival vs Generative Agents Memory Stream vs Claude context window の domain 境界。",
    ),
    "instance": d(
        "可追溯到 Generative Agents (Park 2023)、MemGPT (Packer 2023)、RAG (Lewis 2020) 或 Pinecone/Qdrant 官方 API 的具体实例。",
        "Concrete instance traceable to Generative Agents (Park 2023), MemGPT (Packer 2023), RAG (Lewis 2020), or Pinecone/Qdrant official APIs.",
        "Generative Agents (Park 2023)、MemGPT (Packer 2023)、RAG (Lewis 2020)、Pinecone/Qdrant 公式 API に追跡可能な具体実例。",
    ),
}


def module_key(relative_path: str) -> str:
    checks = [
        ("memory-stores-scopes", "memory-stores-scopes"),
        ("memory-context", "memory-context"),
        ("memory-chunking-situating", "memory-chunking-situating"),
        ("memory-embedding-indexes", "memory-embedding-indexes"),
        ("memory-retrieval-ranking", "memory-retrieval-ranking"),
        ("memory-ingestion", "memory-ingestion"),
        ("memory-lifecycle", "memory-lifecycle"),
    ]
    for fragment, key in checks:
        if fragment in relative_path:
            return key
    return "memory-plane"


def infer_kind(example_id: str) -> str:
    eid = example_id.lower()
    if "counterexample" in eid or "-counter-" in eid:
        return "counterexample"
    if "boundary" in eid:
        return "boundary"
    if "instance" in eid:
        return "instance"
    return "positive"


def get_descriptions(node_id: str, kind: str, module: str) -> dict[str, str]:
    if node_id in NODE_DESCRIPTIONS and kind in NODE_DESCRIPTIONS[node_id]:
        return NODE_DESCRIPTIONS[node_id][kind]
    for pattern, descs in PATTERN_DESCRIPTIONS:
        if re.match(pattern, node_id) and kind in descs:
            return descs[kind]
    if module in MODULE_FALLBACKS and kind in MODULE_FALLBACKS[module]:
        return MODULE_FALLBACKS[module][kind]
    return PLANE_FALLBACK[kind]


def count_sources(text: str) -> Counter:
    counts: Counter = Counter()
    for tag in SOURCE_TAGS:
        if tag.lower() in text.lower() or tag.replace(" ", "").lower() in text.lower():
            counts[tag] += 1
    return counts


def process_file(path: Path, root: Path) -> tuple[bool, int, Counter]:
    text = path.read_text(encoding="utf-8")
    node_match = re.search(r"(?m)^id: (.+)$", text)
    if not node_match:
        return False, 0, Counter()
    node_id = node_match.group(1).strip()
    rel = str(path.relative_to(root)).replace("\\", "/")
    module = module_key(rel)

    examples_match = re.search(
        r"(?ms)^examples:\r?\n(.*?)(?=^(?:parent_relation|sources|source_claims|relations):|\Z)",
        text,
    )
    if not examples_match:
        return False, 0, Counter()

    example_section = examples_match.group(1)
    blocks = re.split(r"(?=^  - id: )", example_section)
    updated_examples = 0
    source_counter: Counter = Counter()
    new_blocks: list[str] = []

    for block in blocks:
        if not block.strip():
            continue
        id_match = re.search(r"(?m)^  - id: (.+)$", block)
        if not id_match:
            new_blocks.append(block)
            continue
        example_id = id_match.group(1).strip()
        kind = infer_kind(example_id)
        desc = get_descriptions(node_id, kind, module)

        inline = re.search(
            r"(?m)^    descriptions: \{zh: (.+), en: (.+), ja: (.+)\}\s*$",
            block,
        )
        if inline:
            new_line = (
                f"    descriptions: {{zh: {desc['zh']}, en: {desc['en']}, ja: {desc['ja']}}}"
            )
            old_line = inline.group(0)
            if old_line != new_line:
                block = block.replace(old_line, new_line, 1)
                updated_examples += 1
        else:
            multiline = re.search(
                r"(?ms)^    descriptions:\r?\n(?:      (?:zh|en|ja): .+\r?\n){3}",
                block,
            )
            if multiline:
                replacement = (
                    "    descriptions:\n"
                    f"      zh: {desc['zh']}\n"
                    f"      en: {desc['en']}\n"
                    f"      ja: {desc['ja']}\n"
                )
                if multiline.group(0) != replacement:
                    block = block.replace(multiline.group(0), replacement, 1)
                    updated_examples += 1

        combined = desc["zh"] + desc["en"]
        source_counter.update(count_sources(combined))
        new_blocks.append(block)

    if updated_examples == 0:
        return False, 0, source_counter

    new_example_section = "".join(new_blocks)
    new_text = text[: examples_match.start(1)] + new_example_section + text[examples_match.end(1) :]
    path.write_text(new_text, encoding="utf-8", newline="\n")
    return True, updated_examples, source_counter


def main() -> None:
    files = sorted(MEMORY_PLANE.rglob("node.yaml"))
    updated_files = 0
    total_examples = 0
    aggregate_sources: Counter = Counter()
    modules: dict[str, dict] = defaultdict(lambda: {"updated": 0, "nodes": []})

    for path in files:
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        node_match = re.search(r"(?m)^id: (.+)$", path.read_text(encoding="utf-8"))
        node_id = node_match.group(1).strip() if node_match else path.stem
        changed, ex_count, sources = process_file(path, ROOT)
        aggregate_sources.update(sources)
        if changed:
            updated_files += 1
            total_examples += ex_count
            mod = module_key(rel)
            modules[mod]["updated"] += 1
            modules[mod]["nodes"].append(node_id)

    summary = {
        "updatedFileCount": updated_files,
        "updatedExampleCount": total_examples,
        "totalNodeFiles": len(files),
        "modules": dict(modules),
        "sourceCitationStats": dict(sorted(aggregate_sources.items(), key=lambda x: (-x[1], x[0]))),
        "sourceHints": {
            "papers": "Generative Agents, MemGPT, RAG, RAPTOR, Lost in the Middle, HyDE, ColBERT, Contextual Retrieval, Self-RAG",
            "projects": "Pinecone, Weaviate, Qdrant, ChromaDB, pgvector, LlamaIndex, Redis, Cursor IDE Context, Claude/Anthropic Context",
            "deprecated_primary": "Mem0, LangGraph Store (replaced as primary citations in examples)",
        },
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
