<div align="center">
  <img src="assets/moonweave-agent-ontology-mark.svg" alt="Moonweave Agent Ontology ロゴ" width="152" />

  <h1>Moonweave Agent Ontology</h1>

  <p>
    エージェントシステムのための証拠制約型オントロジー工学フレームワーク：
    実行、情報、記憶、オーケストレーション、ツール、安全性、フィードバック、
    アダプター、スキーマ、グラフ探索。
  </p>

  <p>
    <a href="https://moonweave-ai.github.io/moonweave-ai-agent-schema/">エクスプローラー</a>
    · <a href="../README.md">英語ドキュメント</a>
    · <a href="README.zh.md">中国語ドキュメント</a>
    · <a href="../ontology/agent-ontology.json">標準オントロジー JSON</a>
    · <a href="../schemas/agent-ontology.schema.json">JSON Schema</a>
  </p>
</div>

## プロジェクトの位置づけ

Moonweave Agent Ontology は、エージェントシステムのための標準オントロジー成果物です。
プロンプト集、評価ランキング、単発のグラフ試作ではありません。このリポジトリの中心は、
スキーマ、グラフ中間表現、フロントエンド、意味論的エクスポート、プロトコルアダプターが
共通して参照できるオントロジー工学の基盤です。

現在の正式な入口は次のとおりです。

- `ontology/agent-ontology.json`：機械可読の標準オントロジー；
- `ontology/agent-ontology.md`：人間向けの要約；
- `schemas/agent-ontology.schema.json`：JSON Schema Draft 2020-12 の構造契約；
- `fixtures/`：有効・無効フィクスチャ；
- `src/`：React と TypeScript によるオントロジーエクスプローラー；
- `research/` と `docs/rfcs/`：Phase 0/1 の証拠、出典登録、制約、判断、RFC。

正式な製品面は、標準オントロジー、スキーマ、研究登録、RFC、フィクスチャ、テスト、エクスプローラーです。

## なぜエージェントシステムにオントロジーが必要か

現代のエージェントシステムは、単一のモデル呼び出しではありません。実運用では、
長時間の実行セッション、復元可能な状態、検索された文脈、記憶ストア、ツール呼び出し、
サブエージェント、引き継ぎ、遠隔委任、プロトコル境界、権限確認、安全判断、
人間によるレビュー、評価上の圧力、デプロイ固有のアダプターが同時に存在します。

オントロジーがない場合、これらはフレームワークごとの名称に閉じ込められます。
「引き継ぎ」「ツール呼び出し」「エージェントカード」「チェックポイント」「評価トレース」は
いずれも実在する要素ですが、同じ層に属するとは限りません。本プロジェクトは
コア、プロファイル、アダプターの境界を分けることで、スキーマ、グラフ表示、
フロントエンド検査、意味論的エクスポート、下流アダプターを安定させます。

## オントロジー工学上の参照

本プロジェクトは成熟した領域オントロジーの設計規律を借りますが、その領域内容を
エージェントオントロジーに混ぜ込みません。

| 参照体系 | 採用したパターン | 本プロジェクトでの結果 |
|---|---|---|
| [FIBO](https://github.com/edmcouncil/fibo) と [FIBO オントロジービューアー](https://spec.edmcouncil.org/fibo/ontology) | オントロジーファミリー、安定識別子、成熟度、衛生検査、出典と成果物の分離 | エージェントオントロジーを平坦な概念表ではなく、統治された成果物として扱う。 |
| [Gene Ontology](https://geneontology.org/docs/ontology-documentation/) | 直交する観点、統制語彙、`is_a` と `part_of` の有向非巡回関係 | エージェントの平面を直交させ、分類と構成関係を検査可能にする。 |
| [CIDOC CRM](https://cidoc-crm.org/) | 人、物、場所、活動をイベントで接続するモデル | 実行履歴を、アクター、ツール、資源、ポリシー、出力を結ぶ観測可能イベントとして扱う。 |
| [Palantir Ontology](https://www.palantir.com/docs/foundry/ontology/overview/) | オブジェクト、リンク、アクション、関数による操作可能な意味層 | 用語をオブジェクト、イベント、アクション、ポリシー、資源、アクター、索引、アダプター、関係に分類する。 |
| [DBpedia Ontology](https://www.dbpedia.org/resources/ontology/) と [FOAF](http://xmlns.com/foaf/spec/) | Web 識別子、軽量語彙、Linked Data 実践 | 各用語を安定 IRI で公開し、意味 Web プロファイルへ接続できるようにする。 |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | 出所、生成、帰属、監査 | 出典 ID、制約 ID、提案 ID、レビュー状態、導出メモをガバナンスデータとして扱う。 |

## 現在の規模

| 指標 | 現在値 |
|---|---:|
| ドメイン | 1 |
| 平面 | 8 |
| モジュール | 36 |
| クラス | 413 |
| オブジェクトプロパティ | 157 |
| データプロパティ | 92 |
| 注釈プロパティ | 12 |
| 個体 | 75 |
| 公理 | 368 |
| データ型 | 8 |
| オントロジー区画 | 44 |

## 八つのエージェント平面

| 平面 | 範囲 |
|---|---|
| 実行平面 | エージェントシステム、実行セッション、アクター、モデル、トランスクリプト、観測可能イベント、チェックポイント、実行状態。 |
| 情報平面 | テキスト、指示、メッセージ、コマンド出力、保存領域、情報索引、出力断片、開示面。 |
| 記憶平面 | 文書取り込み、チャンク化、埋め込み、ベクトル索引、語彙索引、検索、再ランキング、順位融合、文脈組み立て。 |
| オーケストレーション平面 | 目標、タスク、計画、委任、サブエージェント、経路、ゲート、プロンプト連鎖、並列化、投票、統合、評価ループ。 |
| ツール平面 | ツール登録、定義、発見、照合、呼び出し、実行、MCP 面、ツール結果、実行トランスクリプト。 |
| 安全平面 | 信頼境界、権限確認、許可/拒否/昇格判断、サンドボックス、ネットワーク制御、注入防御、コミットと秘匿化のゲート。 |
| フィードバック平面 | 警告、フィードバック、レビュー、ログ、指標、最適化ループ、復旧イベント、評価信号。 |
| アダプター平面 | MCP、A2A、フレームワーク、ベンチマーク、状態機械、スキーマエクスポート、プロファイル写像。コア意味を再定義しない。 |

## レイヤー境界

- コア用語は、エージェントシステム横断で観測可能でなければならない。
- プロファイル用語は、記憶、オーケストレーション、検証、ライフサイクルなどの再利用可能な任意ビューを記述する。
- アダプター用語は外部プロトコル、フレームワーク、ベンチマークを写像し、コアを汚染しない。
- 隠れた思考過程は、必須フィールド、フィクスチャ、スキーマオブジェクト、UI 表示対象ではない。
- ベンチマークスコアと環境圧力は評価アダプターのメタデータであり、コアではない。
- 権限、遠隔実行、ツール出力、記憶検索、プロトコルメタデータをまたぐ関係は信頼境界を参照する。

## ディレクトリ構成

```text
.
|-- ontology/
|   |-- agent-ontology.json
|   `-- agent-ontology.md
|-- schemas/
|   `-- agent-ontology.schema.json
|-- fixtures/
|   |-- valid/
|   `-- invalid/
|-- research/
|   |-- source-registry.csv
|   |-- living-source-metadata.csv
|   |-- pl-pr-core-profile-adapter-matrix.md
|   `-- source-notes/
|-- docs/
|   |-- README.zh.md
|   |-- README.ja.md
|   |-- assets/
|   |-- design/
|   |-- governance/
|   `-- rfcs/
|-- src/
|-- tests/
|-- e2e/
`-- scripts/
```

## ローカル実行

依存関係をインストールします。

```bash
npm ci
```

エクスプローラーを起動します。

```bash
npm run dev
```

検証を実行します。

```bash
npm run verify
npm run e2e
```

拡張オントロジーを再生成します。

```bash
npm run ontology:expand
```

## 証拠とガバナンス

このオントロジーは証拠制約型の成果物です。採択済みの用語と関係は、
Phase 0 の出典登録、統合制約、Phase 1 の RFC 判断へ追跡できなければなりません。

主要なガバナンスファイル：

- `research/source-registry.csv`：出典登録；
- `research/living-source-metadata.csv`：変化する出典のバージョン、日付、正規化状態；
- `research/source-notes/fibo-alignment-review.md`：FIBO との整合レビュー；
- `research/source-notes/cross-domain-ontology-pattern-review.md`：分野横断オントロジーパターンの修正；
- `docs/governance/source-and-schema-governance.md`：出典再確認、スキーマ版管理、信頼境界の方針；
- `docs/rfcs/0001-ontology-layers.md`：オントロジーレイヤー境界；
- `docs/rfcs/0002-canonical-schema-contract.md`：標準スキーマ契約；
- `docs/rfcs/0003-statechart-and-protocol-model.md`：状態機械とプロトコルのモデリング境界。

## 現在の状態

Phase 0 と Phase 1 は、現在の標準成果物について完了しています。次の段階では：

1. 標準オントロジーから本番向けスキーマ、プロファイル、意味論的エクスポートを生成する；
2. グラフ中間表現と状態機械ビューを投影として扱い、事実源にしない；
3. Moonweave 風のオントロジーエクスプローラーを標準成果物に沿って改善する；
4. MCP、A2A、フレームワーク写像、ベンチマーク写像のアダプターフィクスチャを追加する。

## 公開

エクスプローラー：

[https://moonweave-ai.github.io/moonweave-ai-agent-schema/](https://moonweave-ai.github.io/moonweave-ai-agent-schema/)

UI は Moonweave の月光研究室の視覚言語を維持しながら、FIBO に近い
オントロジーファミリー閲覧構造を採用します。ドメイン、平面、モジュール、クラス、
関係、スカラー項目、個体、公理、証拠を一貫して確認できます。
