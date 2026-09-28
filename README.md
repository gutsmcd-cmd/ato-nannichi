# あと何日（ato-nannichi）

旅行・誕生日・記念日までの「あと何日」と、始まった日からの「何日経過」を数える、端末だけで動く日数カウンター PWA です。

**無料・広告なし・ログイン不要・通信なし・アナリティクスなし。** 一度開けばオフラインで動きます。UI は日本語が初期設定で、右上で 日本語 / English を切り替えられます（`ato-nannichi-lang`）。

## 主な機能

- 予定の追加・編集・削除（タイトル・日付・絵文字・カラー）
- 未来の日付は「あと N 日」、過去の日付は「N 日経過」を表示
- 「毎年くり返す」で誕生日・記念日を毎年自動カウント（何回目かも表示）
- 近い順・日付順・追加順で並べ替え。いちばん近い予定を大きく表示
- データは localStorage（`ato-nannichi:v1`）にだけ保存

## 使い方（開発）

```bash
npm install
npm run dev       # Vite 開発サーバー
npm run build     # 型チェック + 本番ビルド → dist/
npm run preview   # 本番ビルドのプレビュー
```

## デプロイ

GitHub Pages：`.github/workflows/pages.yml`（npm ci → build → `dist` をアップロード → deploy-pages）。`base: './'` なのでサブパス（`/ato-nannichi/`）でも動きます。

## プライバシー

データはすべてこの端末のブラウザ内にだけ保存されます。サーバー・外部 API・トラッキング・広告は一切ありません。

---

## English

**Days Until** — A tiny offline day counter: days until trips, birthdays and anniversaries, or days since something started.

Free, no ads, no login, no network calls, no analytics. Works fully offline once loaded and can be installed to the home screen as a PWA. The UI defaults to Japanese; switch 日本語 / English at the top right.

- Add, edit and delete events with a title, date, emoji and colour
- Shows “N days to go” for future dates and “N days ago” for past dates
- Optional yearly repeat for birthdays and anniversaries (with the count, e.g. #27)
- Sort by nearest, by date or by when added; the next event gets a big hero card
- Data lives only in localStorage (`ato-nannichi:v1`)

Tech: Vite + vanilla TypeScript + `vite-plugin-pwa` (`registerType: 'autoUpdate'`, `base: './'`). Deploys to GitHub Pages via `.github/workflows/pages.yml`.
