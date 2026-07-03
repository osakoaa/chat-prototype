# Quory Chat Prototype

アンケートセルフレビュー用AIコーチのチャット部分だけを、全画面で表示するプロトタイプです。

## 特徴

- チャットUIを全画面表示(サイドバー等なし)
- ヘッダーに「Quory_Chat_Prototype」表示
- チャットのフロー・ロジック・デザインは既存のプロトタイプから継承
- gemini-2.5-flashを使用
- Basic認証つき

## 起動

```bash
npm install
cp .env.local.example .env.local
# .env.local に GOOGLE_API_KEY 等を設定
npm run dev
```

http://localhost:3000

## 環境変数

- `GOOGLE_API_KEY`: Gemini APIキー(必須)
- `BASIC_AUTH_USER`: Basic認証のユーザー名
- `BASIC_AUTH_PASSWORD`: Basic認証のパスワード

## デプロイ

Vercelにpushすれば自動デプロイされます。
環境変数はVercelのProject Settingsで設定してください。
