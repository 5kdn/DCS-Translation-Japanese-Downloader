# CONTRIBUTING

<!-- TODO: uv + ruffを想定したpythonプロジェクトの例です。実際のプロジェクトに合わせて変更してください。 -->
このリポジトリへの貢献に関心をお寄せいただきありがとうございます。以下のガイドラインに従って、開発・レビュー・リリースに参加してください。

---

## 方針の要約（重要）

- **リポジトリフロー:** GitHub Flow
- **リポジトリ構成:** 単一リポジトリ（モノレポ）
- **デプロイ対象:** `master` ブランチのみ（常にデプロイ可能状態）
- **マージ方式:** **Squash and Merge** をデフォルト
- **コミット/PRタイトル:** [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) 準拠
- **`master` への取り込み手順:**
  1. 作業ブランチを作成
  2. 作業ブランチにコミット
  3. Pull Request (PR) を作成
  4. テスト・CI・レビューをクリア
  5. `master` へ **Squash Merge**

---

## 開発環境（pnpm）

このプロジェクトは **pnpm** を前提にした Node プロジェクトです。

### 前提ツール

- pnpm 10.15

### 初回セットアップ

```powershell
pnpm i
pnpm approve-builds
```
### その他コマンド

```powershell
# コンポーネントのショーケース
pnpm storybook

# デバッグプレビュー
pnpm vite

# ビルド
pnpx vite build

# ビルド成果物を確認
pnpm preview
```

### フォーマッタ & リンター

### テスト

---

## ブランチ運用（GitHub Flow）

- 基本ブランチは `master` です。`master` は常に **デプロイ可能** な状態を保ちます。
- 作業は課題単位で **短命ブランチ** を切って進めます。
  - 例: `feat/short-description`, `fix/issue-123`, `docs/update-contributing`
- `master` から分岐 → 変更 → PR → レビュー/CI 通過 → **Squash Merge** → `master` へ反映。

### コミット & PR タイトル規約（Conventional Commits）

- 形式: `type(scope): summary`
- 主な `type`: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- 例:
  - `feat(api): add user search endpoint`
  - `fix(db): handle null on migration`
  - `docs: update README for setup with uv`

> **PR タイトル** は Squash 時にコミットメッセージとして採用されるため、Conventional Commits に準拠してください。

---

## Pull Request（PR）

**PR を小さく、レビューしやすく** 保つことを推奨します。

### PR 作成前チェックリスト

- [ ] `ruff format` を実行した
- [ ] `ruff check --fix` で警告/エラーを解消した
- [ ] （採用している場合）テストを追加/更新し、ローカルで成功した
- [ ] 破壊的変更があれば、ドキュメントと変更点を明記した

### PR 説明テンプレート

PULL_REQUEST_TEMPLATE.md を参照してください。

```

### レビュー

- **レビュー観点**: 設計妥当性、テスト、影響範囲、可読性、Conventional Commits、CI 結果。
- **マージ権限**: 原則として **Maintainer** が最終マージ（必要に応じて Reviewer も可）。
- **Squash and Merge** をデフォルトとし、PR タイトルを最終コミットメッセージに採用します。

---

## ドキュメント

- 設定・仕様・設計に変更があれば、`README.md` / `docs/` / `CHANGELOG` 等を更新してください。
<!-- TODO: uv + ruffを想定したpythonプロジェクトの例です。実際のプロジェクトに合わせて変更してください。 -->
- コード例・コマンド・設定は可能な限り `pyproject.toml` に集約し、`uv` 経由で再現可能にします。

---

## CI/CD

- `master` への取り込み前に **CI がグリーン** であることが必須です。
- セキュリティ/品質/テストの自動チェックはワークフローで実施します（内容は `.github/workflows/` を参照）。

---

## リリース

- `master` が常にデプロイ可能であることを前提に運用します。
- リリース実施方法やアセット添付の自動化は、ワークフローおよび運用ドキュメントに従ってください（本ドキュメントでは詳細規定しません）。

---

## コードスタイル

- .editorconfig を確認してください。
- 型: 可能な限り型注釈（`typing` / `pydantic` 等）を付与してください。
- 例外/ログ: ログ出力の方針がある場合はそれに従い、例外はコンテキストを含めて握りつぶさないこと。

---

## Issue 運用

ISSUE_TEMPLATE を参照してください。

---

## 行動規範

CODE_OF_CONDUCT.md を参照してください。

---

## よくある質問（FAQ）

---

## 連絡先
<!-- TODO: 連絡先の設定 -->
質問や提案は Issue / Discussion / PR でお願いします。重大なセキュリティ問題は公開前にメンテナへ直接ご連絡ください。
