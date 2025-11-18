# 画像・スクリーンショット 📷

このディレクトリには、NFCキッズポイントシステムの説明に使用する画像やスクリーンショットを配置します。

## 📁 ディレクトリ構成

```
images/
├── README.md                 # このファイル
├── system-overview.png       # システム概要図
├── dashboard.png            # メインダッシュボードのスクリーンショット
├── user-detail.png          # ユーザー詳細画面のスクリーンショット
├── iphone-shortcut.png      # iPhoneショートカット設定画面
├── nfc-tags/                # NFCタグ関連の画像
│   ├── nfc-tag-example.jpg  # NFCタグのサンプル画像
│   └── nfc-scanning.jpg     # NFCスキャンの様子
├── setup/                   # セットアップ手順のスクリーンショット
│   ├── google-sheets.png    # Google スプレッドシート作成
│   ├── apps-script.png      # Apps Script エディタ
│   ├── deploy-webapp.png    # Webアプリデプロイ画面
│   └── shortcut-setup.png   # ショートカット設定画面
└── demo/                    # デモ用画像
    ├── family-using.jpg     # 家族での利用風景
    └── kids-excitement.jpg  # 子供たちの喜ぶ様子
```

## 🖼️ 必要な画像

### システム関連
- [ ] システム全体の構成図
- [ ] データフロー図
- [ ] アーキテクチャ図

### UI/UXスクリーンショット
- [ ] メインダッシュボード（デスクトップ・モバイル）
- [ ] ユーザー詳細ページ（各種グラフ表示）
- [ ] レスポンシブデザインの様子

### セットアップ手順
- [ ] Google スプレッドシート作成手順
- [ ] Apps Script エディタの画面
- [ ] Webアプリデプロイ設定
- [ ] iPhoneショートカット設定画面
- [ ] NFCオートメーション設定

### 実物写真
- [ ] NFCタグのサンプル
- [ ] iPhoneでのNFCスキャンシーン
- [ ] 家族での利用風景

## 📐 画像仕様

### スクリーンショット
- **解像度**: 最低1280x720px
- **フォーマット**: PNG（UI）、JPG（写真）
- **ファイルサイズ**: 500KB以下推奨

### 図表・チャート
- **解像度**: 1920x1080px推奨
- **フォーマット**: PNG（背景透明対応）
- **スタイル**: システムのカラーテーマに統一

### 写真
- **解像度**: 1200x800px以上
- **フォーマット**: JPG
- **品質**: 85%圧縮推奨

## 🎨 スタイルガイド

### カラーパレット
```css
プライマリカラー: #4285f4 (Google Blue)
アクセントカラー: #ff6b6b (Today Red)
セカンダリ: #ffa726 (Yesterday Orange)
背景: #f5f5f5 (Light Gray)
テキスト: #333333 (Dark Gray)
```

### フォント
- **英語**: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial
- **日本語**: システムフォント推奨

## 📝 画像の追加方法

1. 適切なディレクトリに画像ファイルを配置
2. ファイル名は英語、小文字、ハイフン区切りで統一
3. README.mdの該当セクションで画像を参照
   ```markdown
   ![説明文](images/filename.png)
   ```

## 🔗 使用例

```markdown
# システム概要
![システム概要](images/system-overview.png)

# ダッシュボード
| メイン画面 | ユーザー詳細 |
|-----------|------------|
| ![Dashboard](images/dashboard.png) | ![User Detail](images/user-detail.png) |

# セットアップ手順
![Google Sheets](images/setup/google-sheets.png)
```

## 📋 TODO: 追加予定の画像

- [ ] システム概要図の作成
- [ ] 実際のダッシュボードスクリーンショット
- [ ] ユーザー詳細ページのスクリーンショット
- [ ] iPhoneショートカット設定画面
- [ ] NFCタグとiPhoneの写真
- [ ] セットアップ手順の各ステップ画面
- [ ] 家族利用風景の写真

## 📄 ライセンス

このディレクトリ内の画像は、プロジェクト全体と同様にMITライセンスの下で提供されます。ただし、実際の人物写真等については、適切な許可を得た上で使用してください。

---

**注意**: 実際の画像ファイルは、システムの実装完了後に追加してください。