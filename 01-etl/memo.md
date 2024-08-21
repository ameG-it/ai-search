# ETL 処理

## 準備

プロジェクトを初期化

```bash
npm init
```

必要なファイルを作成

```bash
mkdir data
touch .env
touch index.js
```

デバック用の
launch.json を作成し
環境変数を取り込めるように記述を追加

```json
 "envFile": "${workspaceFolder}/.env"
```

## ETL パイプラインのフォーマット変異

### Extract(抽出)

PDF からテキスト情報を抽出する

今回は pdfreader を利用

```
npm install pdfreader
```

#### チャンク分割

OpenAi への組み込みを行う際、問題となるのがトークンサイズ
トークンサイズをオーバーしてしまわないよう
あらかじめチャンク分割しておく

```
npm install langchain
```

#### Embedding API 埋め込み API

与えられた文字列のベクトル表現を返す
OpenAIEmbeddings クラスを使用する。

### Transform(変換)

### Load(書き込み)

### インデックスの作成

https://learn.microsoft.com/ja-jp/azure/search/search-get-started-vector?tabs=azure-cli

### データ登録
