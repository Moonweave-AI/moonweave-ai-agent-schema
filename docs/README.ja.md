<div align="center">
  <img src="assets/moonweave-agent-ontology-mark.svg" alt="Moonweave Agent Ontology ロゴ" width="152" />

  <h1>Moonweave Agent Ontology</h1>

  <p>
    エージェントシステムのための単一ソース・オントロジー工学ワークスペース：
    再帰 YAML ソース、決定論的 JSON 投影、Graphify 風のエクスプローラー。
  </p>

  <p>
    <a href="https://moonweave-ai.github.io/moonweave-ai-agent-schema/">エクスプローラー</a>
    · <a href="../README.md">英語ドキュメント</a>
    · <a href="README.zh.md">中国語ドキュメント</a>
    · <a href="../src/generated/agent-ontology.json">生成オントロジー JSON</a>
  </p>
</div>

## プロジェクトの位置づけ

Moonweave Agent Ontology は、エージェントシステム構築のための統治されたオントロジー成果物です。プロンプト集、ランキング、単発のグラフ試作ではありません。

現在の編集可能な権威ソースは一つだけです。

- `ontology/node.yaml` がルートノードであり、成果物メタデータ、ガバナンス、出典カタログを保持します。
- 各下位ノードは自分のディレクトリに一つの `node.yaml` を持ちます。
- 直接の子ディレクトリがそのまま本体階層です。`children/` ラッパーは使いません。
- 並行する JSON、CSV、Markdown、移行、ABox、TBox、Instance、Schema、Evidence の第二ソースはありません。
- `src/generated/` は読み取り専用の生成物です。
- `src/` の React エクスプローラーは現在の Graphify 風 UI で生成投影を表示します。

定義、説明、例、反例、構造フィールド、制約、統制値、出典主張、レビュー注記、関係詳細は、該当ノードまたは関係の情報です。別のグラフノードや第二の閲覧構造にはしません。

## ソース構造

物理ディレクトリは論理オントロジーツリーを直接表します。

```text
ontology/
|-- node.yaml
|-- info-plane/
|   |-- node.yaml
|   `-- <module>/
|       |-- node.yaml
|       `-- <concept>/
|           |-- node.yaml
|           `-- <narrower-concept>/
|               `-- node.yaml
|-- runtime-plane/
|   `-- ...
`-- tool-plane/
    `-- ...
```

ビルダーとテストが強制する規則：

- 読み取るソースは `ontology/` だけ；
- 各ノードディレクトリは `node.yaml` を一つだけ持つ；
- 概念の深さは論理に応じて任意；
- ファイル配置の親子関係が主階層；
- クロスリンクは関係情報であり、ファイル所有を変えない；
- 歴史・移行・廃止資料はソース権威として残さない；
- 生成物は YAML から原子的に構築し、`npm run ontology:check` で読み取り専用のドリフト検査を行う。

## 八つのドメイン

最上位は八つの運用関心ドメインです。

| ドメイン | 範囲 |
|---|---|
| コンテキスト取り込みとステージング | 観測可能な内容がエージェント手順またはモデル呼び出しの文脈になる過程。 |
| 制御とオーケストレーション | 目標、計画、経路、委任、引き継ぎ、ゲート、構成。 |
| 実行状態とトレース | セッション、試行、結果、権限バインディング、トレースイベント、チェックポイント、成果物。 |
| 相互運用とアダプター | プロトコル、フレームワーク、ベンチマーク、状態図、スキーマ/エクスポート、言語プロファイル、グラフ、フロントエンド適配。 |
| 能力とリソース呼び出し | 能力登録、ツール、リソース、プロンプト、API、発見、呼び出し、副作用証拠。 |
| 信頼・ポリシー・安全 | 信頼境界、権限、ポリシー、サンドボックス、注入防御、コミットゲート、秘匿、開示。 |
| 観測可能性とフィードバック | 診断、ログ、指標、レビュー、修正、評価、復旧、フィードバックループ。 |
| 記憶とコンテキスト永続化 | 記憶ストア、記録、取り込み、チャンク化、索引、検索、要約、ライフサイクル、汚染制御。 |

ドメインとモジュールは安定した入口であり、深さの上限ではありません。概念ノードは実際の論理に従ってさらに下へ展開できます。

## ビルドと検証

依存関係：

```bash
npm ci
```

オントロジー投影の生成：

```bash
npm run ontology:build
```

生成物ドリフト検査：

```bash
npm run ontology:check
```

ローカル表示：

```bash
npm run dev
```

完全検証：

```bash
npm run verify
```

主要コマンド：

| コマンド | 目的 |
|---|---|
| `npm run ontology:build` | `ontology/` から `src/generated/agent-ontology.json`、`source-index.json`、`ontology-community-graph.json` を生成する。 |
| `npm run ontology:check` | YAML ソースと生成物の一致を読み取り専用で検査する。 |
| `npm run ontology:communities:check` | canonical モジュール所有に基づいてコミュニティグラフを検証する。 |
| `npm run test:unit` | オントロジー再生成後に単体・統合テストを実行する。 |
| `npm run build` | 型検査、Vite ビルド、サイト manifest 生成、サイト成果物検証。 |
| `npm run e2e` | ブラウザー契約テスト。 |

## エクスプローラー

エクスプローラーは一つの Graphify 風グラフだけを表示します。

- ブラウザーでは `vis-network` `ForceAtlas2Based` の力指向ビューを使う；
- ノード色は canonical モジュール所有を表す；
- ノードサイズは構造上のハブを示す視覚補助であり、業務重要度ではない；
- 辺ラベルは既定ではキャンバスに詰め込まず、詳細とホバー情報で説明する；
- 出典、例、フィールド、制約、統制値、レビュー注記、関係詳細はノード/関係情報パネルに表示する；
- 並行する Schema、Instance、Evidence、Adapter、ABox、TBox ページはない。

公開コミュニティは本体のモジュール所有から得ます。統計クラスタリングや視覚レイアウトは探索補助であり、本体所有を変更しません。

## 公開

GitHub Pages:

[https://moonweave-ai.github.io/moonweave-ai-agent-schema/](https://moonweave-ai.github.io/moonweave-ai-agent-schema/)

本番サイトは同一コミットから生成されます。ソース指紋、生成 canonical、本体コミュニティグラフ、デプロイ commit は build manifest で結びます。
