# 事前生成 OGP PoC

既存の Takumi PoC をローカル workerd で実行して、日本語カード 4 種を PNG にします。生成後の PNG はハッシュ付きのファイル名で Static Assets に配置します。配信時に Takumi、WASM、フォント、D1 は動きません。

```sh
pnpm run poc:ogp-static:build # 4 枚の生成・検証と Wrangler dry-run。公開しない
pnpm run poc:ogp-static:test  # Static Assets のローカル配信を検証
```

成果物は `.wrangler/ogp-static-assets/` に作られます。`manifest.json` にサンプル名と画像パスを記録します。画像が変わればパスも変わり、古い画像は削除しません。生成テストや PNG 検査が失敗するとビルドを中断し、成果物を書き換えません。

`wrangler.jsonc` は専用名 `nyatinte-ogp-static-poc`、`workers_dev: false`、プレビュー URL なし、route・domain・D1 binding なしです。実サイトへのデプロイはこの手順に含めません。以前公開した動的確認用 Worker はこの変更では削除・更新しません。

これは固定フィクスチャの PoC です。投稿時の画像生成、実績の revision と画像パスの結び付け、汎用画像へのフォールバックは未実装です。X が一度取得した OGP は更新されないことがあるため、実際の投稿では画像の準備後に固有の URL を公開する方針です。
