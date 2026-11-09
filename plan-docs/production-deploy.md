# 本番Deployの手順

本番Deployは、GitHub Actionsの `CI` を `main` から手動実行し、入力 `production_deploy` に `deploy` を選んだ場合だけ開始する。既定値は `skip`。PRと `main` へのpushではVerifyを実行し、Deployはスキップする。

## Deploy前の確認

1. 対象コミットのレビューと `Verify` 成功を確認する。`main` push後のCIで `Deploy` が `skipped` であることも確認する。
2. GitHubの `production` Environmentに必須レビュアーを設定し、Deployジョブが承認待ちになることを確認する。環境保護ルールが未設定なら本番Deployを開始しない。
3. 本番D1のbinding名とDB IDを管理者がCloudflare上の既存リソースと照合し、専用PRで `cloudflare.config.ts` とVarlock互換設定 `wrangler.varlock.jsonc` の両方に設定済みであることを確認する。IDを推測して設定しない。現行mainにはD1 bindingがないため、D1を使う変更はbinding用の別PRが先行するまでDeployしない。
4. 対象のD1 migrationをレビューし、適用対象DB・適用順・復旧手順を確認する。migration適用は本番変更として、明示的に承認された手順で別途実施する。CIやこの手順は本番D1に接続・適用しない。
5. Cloudflare Accessの `/mcp` ポリシー、チームドメイン、audience、サービス認証の準備を管理者が確認する。Access設定やtokenの作成・変更はこのDeploy手順に含めない。
6. 上記の本番準備と変更承認が揃った後だけ、Actionsの `CI` を `main` から手動実行し、`production_deploy=deploy` を選択する。Environmentの承認後にDeployが進むことを確認する。

このリポジトリのCIはproduction用Cloudflare secretの値を表示しない。調査時もsecret値、token、DB IDをログやPR本文へ出力しない。
