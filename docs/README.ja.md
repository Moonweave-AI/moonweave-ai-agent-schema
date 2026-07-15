<div align="center">
  <img src="assets/moonweave-agent-ontology-mark.svg" alt="Moonweave Agent Ontology ロゴ" width="152" />

  <h1>Moonweave Agent Ontology</h1>

  <p>
    エージェントシステムのための証拠制約型オントロジー工学フレームワーク：
    実行、情報、記憶、オーケストレーション、能力とリソース呼び出し、安全性、フィードバック、
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

ドメイン意味論を編集できる場所は `ontology/source/**` だけです。標準 JSON、Markdown、
ルート Schema、TypeScript 型、出典索引、定義台帳、payload フィクスチャは決定論的に生成されます。

Moonweave は一つの canonical Agent Ontology グラフを公開します。定義、構造制約、インスタンス、
正例・反例、出典主張、写像、ガバナンス情報は対応するノードまたは関係に付随し、並行する本体や閲覧ページを作りません。

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

公開規模は `ontology/agent-ontology.json` の生成済み `ontology_metrics` を正とし、
文書には変動しやすい数値を複製しません。新しい指標は概念、`is_a`、意味関係、構造フィールド、
統制値、インスタンス例、制約、出典主張、ケース経路を区別し、旧版の並行コレクションを階層として扱いません。

## 八つの運用関心ドメイン

Moonweave Agent Schema は、コンテキスト取り込みとステージング、制御オーケストレーション、実行、相互運用アダプテーション、能力とリソース呼び出し、信頼と安全の仲介、観測可能なフィードバック、記憶永続化という八つの運用関心ドメインでエージェントシステムを整理します。

| 運用関心ドメイン | 範囲 |
|---|---|
| コンテキスト取り込みとステージングドメイン | 観測可能な内容がモデル呼び出しまたはエージェント手順の可視コンテキストになる過程を扱います。メッセージと指示の包絡、出典参照、内容ブロック、コンテキストウィンドウ、軽量発見ポインタ、開示済み出力セグメント、実行観測を含みます。 |
| 制御とオーケストレーションドメイン | 目標、操作可能な目的、タスク計画、委任帰属、引き継ぎ、エージェント道具呼び出し、文脈隔離、作業者選択、経路目標、ゲート、オーケストレーション構造、プロンプト連鎖、並列構成、統合来歴、境界付きフィードバックと再試行ループ。 |
| 実行状態とトレースドメイン | 実行の包絡と生の実行証拠を扱います。実行セッション、実行試行、結果、アクター権限バインディング、トレース・スパン・イベント構造、チェックポイント、スナップショット、状態差分、復元と再生イベント、成果物の生成・消費・派生来歴を含みます。 |
| 相互運用とアダプタドメイン | 外部プロトコル、フレームワーク、ベンチマーク、状態図、スキーマとエクスポート、言語プロファイル、グラフ中間表現、フロントエンド投影を標準本体へ入れる前のアダプタ膜。方向付き写像、出典と版の来歴、変換警告を記録し、アダプタ固有フィールドがコア用語を汚染しないようにします。 |
| 能力とリソース呼び出しドメイン | 能力登録簿、ツール/リソース/プロンプト/API 定義、発見と選択、Schema 適合、ツール実行、リソース読み取り、プロンプトインスタンス化、MCP プロトコルサーフェス、認可ブリッジ、診断、追跡/文脈引き渡し、監査可能な副作用。 |
| 信頼、ポリシー、安全ドメイン | 信頼境界、権限範囲、権限プロンプト、ポリシー判断、サンドボックスとネットワーク制御、送信元から受信先への注入防御、メモリ汚染信号、副作用コミットゲート、秘匿、監査開示を監査可能な安全伝播グラフとして扱う。 |
| 観測可能性とフィードバックドメイン | 生の実行証拠から警告、エラー、診断、テレメトリ、ログ、監査、トレースエクスポート、レビュー所見、修正、汎用指標と評価実行、復旧アクション、学習信号を導き、明示的なフィードバックフロー関係でオーケストレーション、記憶、ツール選択、ポリシー、最適化ループへ戻します。ベンチマーク固有の意味はアダプター層に残します。 |
| 記憶とコンテキスト永続化ドメイン | スコープ付き記憶ストア、記憶レコードと類型、取り込み、チャンク化、埋め込みと索引、検索と順位付け、コンテキスト組立、要約、嗜好記憶、書き込み、更新、削除、結合、集約、期限切れ、検証、反省、監査、記憶汚染制御などのライフサイクル操作。 |

## レイヤー境界

Core/Profile/Adapter は所有と適用範囲の注釈であり、第二のナビゲーション階層ではありません。
エクスプローラーの唯一の主階層は「Agent Ontology → ドメイン → モジュール → 概念 → より具体的な概念 → …」です。
ドメインとモジュールは安定した入口であり、概念の深さを制限しません。

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

未公開候補を構築し、レビュー済み正式成果物ツリーをローカルに具体化して、生成物のドリフトを検査します。
リポジトリでの公開には、実行環境固有のレビュー済み視覚ゲートを通し、成果物と基準画像を同じコミットへ含める必要があります。

```bash
npm run ontology:build
npm run ontology:release
npm run ontology:check-generated
```

`npm run ontology:expand` は旧コマンド互換用で、非推奨警告の後に source-first builder を呼び出します。

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
- `docs/rfcs/0005-unified-concept-hierarchy-and-node-information.md`：単一グラフ階層とインライン情報契約；
- `docs/governance/v1-to-v2-canonical-migration-guide.md`：v1 から v2 へのフィールド、利用者、ロールバック移行手順。

## 現在の状態

v3 ビルドパイプラインは source-first とレビューゲートを採用します。八ドメインと
`ontology_metrics.modules` が報告する accepted の能力境界モジュールは一つの canonical グラフを共有します。概念は審査済みの分類または構造
バックボーンに沿って任意深度へ展開でき、フィールド、統制値、例、出典、写像、検証制約は対応ノードまたは関係に残ります。
Graph IR、payload Schema、fixture、将来の意味エクスポートは生成投影であり、編集可能な事実源ではありません。

Explorer は引き続きこの一つのグラフだけを表示し、Graphify を参考にしたローカル同梱の
`vis-network` `ForceAtlas2Based` ビューを使います。オフラインの NetworkX `MultiDiGraph` は
方向付き・複数述語・多重関係を完全に保持し、そこから作る単純無向投影は決定的な
Leiden/Louvain コミュニティ検出だけに使います。コミュニティ色とハブの大きさは視覚上の補助であり、
オントロジー型、階層、業務上の重要度ではありません。初回安定化後に物理計算を停止し、検索、
コミュニティ絞り込み、フォーカス、パン、ズーム、ドラッグは同じグラフ内で行います。階層/関係の
二重モードや上下/左右のレイアウト方向コントロールはありません。production build manifest は
配置 commit と canonical/source 指紋を結びます。

`artifact_metadata.release_channel="candidate"` または `releasable=false` の成果物は、
内部 `status` が `accepted` でも未公開の検証候補です。v3 の正式公開は、ルート canonical と
全生成物を原子的に切り替え、ルート成果物が `release` かつ `releasable=true` になった時だけ成立します。

## 公開

エクスプローラー：

[https://moonweave-ai.github.io/moonweave-ai-agent-schema/](https://moonweave-ai.github.io/moonweave-ai-agent-schema/)

UI は Moonweave の月光研究室の視覚言語と FIBO に近い再帰閲覧構造を維持しつつ、
一つのグラフと同じページ内のノード／関係特性表だけを表示します。並行する Schema、ABox、
TBox、Instance、証拠、アダプターページはありません。
