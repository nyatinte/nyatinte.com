# `/pogo` ポゴホッピング PoC 仕様書

_Pogostuck: Rage With Your Friends_（開発者 Superku / Hendrik Felix Pohl、2019-02-28、Steam app 688130）の公開情報に基づき、本リポジトリの `/pogo` ルート向けに最小限の PoC を定義します。公開情報に存在しない数式・定数・補完仕様はすべて「仮定」と明記し、`src/lib/pogo/constants.ts` の定数名へ結び付けて管理します。

## 1. 出典一覧

### 公式・開発者

1. Steam ストア「About This Game」: https://store.steampowered.com/app/688130/Pogostuck_Rage_With_Your_Friends/
2. 公式サイト: https://www.pogostuck.com/
3. 開発者 Superku、2020-09-02: https://steamcommunity.com/app/688130/discussions/0/2948124408713778310/
4. 開発者 Superku、2020-07-15: https://steamcommunity.com/app/688130/discussions/0/2788242183271372329/
5. 開発者 Superku、2019-07-06: https://steamcommunity.com/app/688130/discussions/0/1642041886379797100/
6. 開発者 Superku、2019-07-22: https://steamcommunity.com/app/688130/discussions/0/1643169167159043608/
7. 開発者 Superku、2019-03-04（アナログスティック感度）: https://steamcommunity.com/app/688130/discussions/0/1842440600615114556/

### コミュニティ解説

8. レツ「これからPogostuckを始める方の為の基礎知識」（2020-10-09）: https://note.com/retsu_teno/n/nd7518b0df608
9. アンブラルたかし（2026-09-15）: https://note.com/umbraltakashi/n/n8b898b54c6ab
10. NamuWiki: https://en.namu.wiki/w/Pogostuck:%20Rage%20With%20Your%20Friends
11. Steam ガイド「Beating map 1」（k3llyapplebee）: https://steamcommunity.com/sharedfiles/filedetails/?id=3323449872
12. Speedrun.com: https://www.speedrun.com/pogostuck
13. コミュニティ投稿 kakitsubata（2019-07-21、出典 6 と同一スレッド）: https://steamcommunity.com/app/688130/discussions/0/1643169167159043608/

### 追加調査（ラウンド2）

14. 開発者 Superku、2019-03-04（回転速度の写像。出典 7 の再取得）: https://steamcommunity.com/app/688130/discussions/0/1842440600615114556/
15. Reddit r/PogoStuck、u/Dracibatic（2022-02-01、非公式のコミュニティ測定）: https://www.reddit.com/r/PogoStuck/comments/shtkev/a_small_list_of_pogostuck_stuff_i_found_neat/
16. Reddit r/PogoStuck、u/Willing-Loan-1700（2026-09-10、出典 15 の再掲に見える非公式リスト）: https://www.reddit.com/r/PogoStuck/comments/1wclylp/a_big_list_of_cool_pogostuck_stuff_i_found/

### 追加調査（ラウンド3）

17. 開発者 Superku、2020-07-15（出典 4 の再確認）: https://steamcommunity.com/app/688130/discussions/0/2788242183271372329/
    - ジャンプボタンを押すと hop する。早く離すと短い hop になる。
    - ブーストは空中で回してジャンプを押し続ける。次ジャンプのチャージ中に早く離すとブーストはキャンセルされる。
    - 落下が深いほど接地時間が長く、次ジャンプの狙いを合わせる余裕が増える。
18. 開発者 Superku、2020-09-02（出典 3 の再確認）: https://steamcommunity.com/app/688130/discussions/0/2948124408713778310/
    - 接地前にジャンプを離すとブーストジャンプはキャンセルされる。
19. レツ（出典 8 の再確認）: https://note.com/retsu_teno/n/nd7518b0df608
    - 「ジャンプを押し続けると着地時のジャンプ力が上がる。」
20. Reddit r/PogoStuck、u/realSuperglue（2021-04-13、コミュニティ。開発者本人かは確認できない）: https://www.reddit.com/r/PogoStuck/comments/m5mm0o/how_does_one_use_the_double_jump/
    - 「壁や地面に触れる前にジャンプを押して保持する。通常ジャンプは離したとき、またはポゴが自動で打ち出すときに出る」。ミリ秒の記述は無い。
21. Steam ガイド（出典 11 の再確認）: https://steamcommunity.com/sharedfiles/filedetails/?id=3323449872
    - ジャンプボタンを押し続けると高く跳べる。

ばね・スライダ・先端ピボットの公式記述、着地バッファの公式ミリ秒、接地摩擦の公式数値は、Steam / note / NamuWiki / speedrun / 検索した範囲では見つかりませんでした。一般的なポゴの力学や汎用の jump buffer 解説は本家の出典にしません。

### 追加調査（ラウンド4）

22. Steam ガイド「Beating map 1」（k3llyapplebee、出典 11 の再確認）: https://steamcommunity.com/sharedfiles/filedetails/?id=3323449872
    - 「If you hit your body on any ledge you will lose all momentum potentially loosing a lot of progress」。体が崖に当たると運動量を失う、というコミュニティ記述。開発者の式ではない。
23. NamuWiki Speedrun 記事: https://en.namu.wiki/w/Pogostuck:%20Rage%20With%20Your%20Friends/%EC%8A%A4%ED%94%BC%EB%93%9C%EB%9F%B0
    - Map 1 石炭洞窟の "Head bonk"：右壁に頭を当て、recoil（反動）で左へ落ちる、というコミュニティの技術名。法線反射の式や数値は無い。動画は見ていない。

Superku の公開スレッドと Reddit の非公式測定リストからは、体・頭ヒットの反射式は見つかりませんでした。法線まわりに速度を鏡映するモデルは未確認のため仮定です。既定の体ヒットは出典 11 / 22 の「運動量を失う」に合わせ、`OUCH_BODY_RESTITUTION = 0` とします。

## 2. 確定した仕様（出典あり）

- **自動バウンド**: ポゴ先端が地形へ着地するたびに自動で跳ねます。ボタン無操作でも跳び続けます（出典 8, 9）。
- **ジャンプチャージと hop**: ジャンプボタン（Space）を押し続けると着地時のジャンプ力が上がります。早く離すと短い hop になります（出典 4, 8, 11, 17, 19, 21）。
- **通常ジャンプの発火**: 離したとき、またはポゴが自動で打ち出すときに出ます。壁や地面に触れる前に押して保持するのが基本です（出典 20、コミュニティ。ミリ秒は無し）。
- **空中回転**: 空中で `A` / `D` を押し続けて機体を傾け・回転させます。地面を離れた瞬間から回し始めるのが基本です（出典 3, 4, 8）。
- **入力と回転速度**: アナログ入力の 0–100% はトルクではなく回転速度（turning speed）へ写像されます（出典 7, 14）。キーボード `A` / `D` の最大角速度・角加速度・離鍵後の減衰の数値は公開されていません。
- **ブースト条件（285°）**: 空中で累積回転角が約 `285°` に達するとブーストが成立します（出典 3, 4, 5, 8, 10）。
- **ブースト発動と取消**:
  - 次ジャンプのチャージ中にジャンプボタンを早く離すとブーストはキャンセルされます（出典 3, 4, 5, 17, 18）。
  - ブースト成立後にポゴ先端以外が地形に触れるとブーストを失います（出典 5）。
  - ジャンプを押したまま先端だけで着地すると、次のジャンプがブーストジャンプになります（出典 5, 8）。
- **追加回転の扱い**: `720°` などの追加回転を行っても通常モードのブースト威力は増加しません（出典 6）。
- **落下と接地時間・反発**: 深い落下ほど接地時間が長くなり、次ジャンプの狙いを合わせる余裕が増えます（出典 4, 17）。落下の勢い・高さは着地後のジャンプ力に寄与します（出典 1, 8, 10, 11）。
- **失敗着地（Ouch）**: 先端以外での着地、または先端でも着地面に対する角度が不足した着地ではバランスを失います（出典 8, 11）。壁や天井でも先端着地が成立すれば跳ねます（出典 8, 11）。
- **体ヒットと運動量**: 体が崖などの地形に当たると運動量をすべて失います（出典 11）。先端以外が地形に触れるとブーストを失います（出典 5）。
- **既定操作とカメラ**: `A`（左傾け）、`D`（右傾け）、`Space`（ジャンプ）。矢印キーでカメラを先読みできます（出典 8）。
- **未採用事項**: 連続ブーストでジャンプ力が育つ説（出典 13）は開発者確認が取れていないため採用しません。`E` のエモート（出典 8）とスケートモードは対象外です。

## 3. ラウンド3（Rapier 2D への移行）

ラウンド2 の Matter.js 実装を捨て、2 剛体のばね物理へ作り直しました。`matter-js`、`poly-decomp`、`@types/matter-js` と Matter 専用のコード・テストは削除済みです。Planck は使いません。

### エンジン

- **パッケージ**: `@dimforge/rapier2d` 0.21.0（非 compat）。Vite / Rolldown が `.wasm` を別アセットとして出力するため、追加の WASM プラグインは不要でした。compat の base64 内包よりダウンロードが軽いのでこちらを採用し、`@dimforge/rapier2d-compat` は削除しました。
- **2 剛体**: 胴体（`PLAYER_WIDTH` × `PLAYER_HEIGHT` の箱）とスティック（先端の球）。スティック軸方向のプリズマティック・ジョイントでつなぎ、相対回転を固定します。`PRISMATIC_TRAVEL_PX` の範囲で伸縮し、胴体とスティックの接触は無効にします。
- **ばね**: ジョイントの位置モーター。チャージ中は圧縮目標へ、離陸時は自然長へ戻します。剛性・減衰・最大力・限界は `constants.ts` に置きます。スティックの剛体は CCD 有効です。
- **座標**: Rapier は Y 上向き・メートル、ステージは Y 下向き・ピクセル。`PIXELS_PER_METER` で境界変換し、角度と角速度の符号を反転します（`coords.ts`）。
- **120Hz**: `FIXED_STEP_MS` のアキュムレータとスパイラル・オブ・デス上限を維持し、`world.timestep` を固定ステップに合わせます。描画は直近 2 姿勢の補間です。スナップショットに `physicsStepCount` を含めます。
- **WASM 初期化**: `/pogo` の `onMount` だけが `simulate` を動的 import し、その中で `@dimforge/rapier2d` を動的 import します（モジュール読み込みが WASM の取得とコンパイルを含む）。完了までは読み込み表示（`role="status"`）を出し、失敗時は `role="alert"` に切り替えます。
- **描画**: 胴体・軸・先端の 3 つの div を `translate3d` / `rotate` で更新します。カメラは `#world` への逆向き `translate3d` のままです。

### チャージ・離陸・自動発射

- Space を押し続けると接地中の圧縮が深くなります（出典 17, 19, 21）。押し切ると接触窓の終わりで自動発射し、途中で離すとその時点のチャージで短い hop になります（出典 17, 20）。離したときにブーストのチャージ中ならブーストは取消されます（出典 17, 18）。
- チャージ量は押下時間で `CHARGE_FULL_MS` まで増え、圧縮目標は `UNCHARGED_COMPRESSION_PX` から `CHARGED_COMPRESSION_PX`（ブースト時は `BOOST_COMPRESSION_PX`）へ動きます。

### 着地入力猶予

- `JUMP_PRE_LANDING_BUFFER_MS`: 先端接地の直前に押した Space は、接地時点で既に離されていてもチャージとして数えます。数値は仮定です（公式値なし）。
- 押しっぱなしのチャージは着地をまたいで維持します（出典 17–19。窓の長さの公式値はなし）。
- 接地時間は衝突速度で伸びます（出典 4, 17。式と数値は仮定）。落下が深いほど次の狙いを合わせる余裕が増える、という定性仕様を `GROUND_CONTACT_*` で表します。

### 接地中の先端ピボット

- 先端が有効着地しているあいだ、先端を一時的な revolute ジョイントで地面へ固定し、`A` / `D` で先端を支点に機体を回します。離陸で解除します。
- 斜面が `TIP_PIVOT_MAX_SLOPE_DEG` を超える、または横力が `TIP_PIVOT_MAX_FORCE_N` を超えると解除して滑らせます。公式記述は無く、すべて仮定です。

### 地形のサンプリングと描画

- `path[data-terrain]` を `getTotalLength()` / `getPointAtLength()` で `TERRAIN_SAMPLE_STEP_PX` 間隔にサンプルし、SVG ルート基準の CTM（`svg.getScreenCTM().inverse()` × `path.getScreenCTM()`）で `#world` のカメラ変換を打ち消して `#world` 座標へ写します。`TERRAIN_MIN_EDGE_PX` 未満の辺を捨て、`ColliderDesc.polyline` のポリラインにします。閉じたパスは最後→最初の辺を足して閉じます。
- 地形の `fill` / `stroke` とグリッドは `currentcolor` ではなく `var(--home-foreground)` を使います。地形の塗りは SVG の `fill-opacity`、グリッドは `color-mix` で薄くします。`color-mix(..., currentcolor ...)` は SVG と WebKit・ダークモードで崩れるため使いません。テーマ遷移は `--home-theme-duration` / `--home-theme-easing` だけを使います。

### 実測（仮定の目標との比較）

`pnpm exec vp test --run src/lib/pogo`、Node 26.13.1、Rapier 0.21.0、平らな足場、120Hz 固定ステップ。乱数を使わないため再実行しても同値です。到達高は接地開始時の胴体中心から飛行中の最高点までの差です。

| 条件                       | 実測    | 目標（仮定） |
| -------------------------- | ------- | ------------ |
| 無チャージ自動バウンド     | 89.4px  | 88px         |
| 押し切りチャージ           | 149.2px | 146.7px      |
| チャージ 3 ステップで離す  | 51.3px  | 押し切り未満 |
| 接地中の先端 x 変位（A/D） | 0.08px  | 実質 0       |

目標は 44px の体高に対する `2` / `5/1.5` / `7/1.5` 倍です。ブーストの到達高は着地角度に依存するため、同じばねモデルの押し込み量で目標に合わせます。

## 4. 仮定と定数一覧

公式の数値式・物理パラメータは非公開です。PoC を成立させるための初期値と計算ルールはすべて「仮定」として `src/lib/pogo/constants.ts` にまとめます。

### 固定ステップ・座標・重力

| 定数名                        | 値         | 区分 | 説明                                          |
| ----------------------------- | ---------- | ---- | --------------------------------------------- |
| `FIXED_STEP_HZ`               | `120`      | 仮定 | 物理の固定ステップ周波数                      |
| `FIXED_STEP_MS`               | `1000/120` | 仮定 | 1 ステップの時間（ms）                        |
| `MAX_FRAME_DT_MS`             | `50`       | 仮定 | 1 フレームで取り込む最大経過時間（ms）        |
| `MAX_PHYSICS_STEPS_PER_FRAME` | `8`        | 仮定 | 1 フレームで回す物理ステップの上限            |
| `PIXELS_PER_METER`            | `100`      | 仮定 | ステージ px と Rapier メートルの比率          |
| `GRAVITY_M_PER_SEC2`          | `16`       | 仮定 | 重力（m/s²）。ラウンド2 の `1600px/s²` に相当 |

### プレイヤーと地形

| 定数名           | 値     | 区分 | 説明                                                       |
| ---------------- | ------ | ---- | ---------------------------------------------------------- |
| `PLAYER_WIDTH`   | `18`   | 仮定 | 胴体の当たり判定幅（px）                                   |
| `PLAYER_HEIGHT`  | `44`   | 仮定 | 胴体の当たり判定高さ（px）。コミュニティの体高 1.5m に対応 |
| `BODY_TO_TIP_PX` | `46`   | 仮定 | 自然長での胴体中心と先端中心の距離（px）                   |
| `TIP_RADIUS`     | `5`    | 仮定 | 先端円の半径（px）                                         |
| `TORSO_MASS_KG`  | `1`    | 仮定 | 胴体の質量（kg）                                           |
| `STICK_MASS_KG`  | `0.15` | 仮定 | スティックの質量（kg）                                     |
| `TIP_FRICTION`   | `0.05` | 仮定 | 先端の摩擦係数（斜面での滑りを許容）                       |
| `BODY_FRICTION`  | `0.45` | 仮定 | 胴体の摩擦係数                                             |

### ばねと到達高

| 定数名                             | 値      | 区分                          | 説明                                     |
| ---------------------------------- | ------- | ----------------------------- | ---------------------------------------- |
| `PRISMATIC_TRAVEL_PX`              | `30`    | 仮定                          | プリズマティックの可動量（px）           |
| `UNCHARGED_APEX_BODY_HEIGHTS`      | `2`     | 出典なし・仮定                | 無チャージ hop の到達高（体高比）        |
| `CHARGED_APEX_BODY_HEIGHTS`        | `5/1.5` | 非公式（出典 15）・対応は仮定 | "base jump" 5m をチャージ hop に対応     |
| `BOOST_APEX_BODY_HEIGHTS`          | `7/1.5` | 非公式（出典 15）・対応は仮定 | boost jump 7m                            |
| `UNCHARGED_COMPRESSION_PX`         | `14`    | 仮定                          | 無チャージ時にモーターが引く圧縮量（px） |
| `CHARGED_COMPRESSION_PX`           | `18`    | 仮定                          | 押し切り時の圧縮量（px）                 |
| `BOOST_COMPRESSION_PX`             | `24.5`  | 仮定                          | ブースト時の圧縮量（px）                 |
| `SPRING_CHARGE_STIFFNESS`          | `20000` | 仮定                          | チャージ中に圧縮目標へ寄せる剛性         |
| `SPRING_CHARGE_DAMPING`            | `400`   | 仮定                          | チャージ中に振動を抑える減衰             |
| `SPRING_LAUNCH_STIFFNESS`          | `2600`  | 仮定                          | 離陸時に伸ばすばねの剛性                 |
| `SPRING_LAUNCH_DAMPING`            | `4`     | 仮定                          | 離陸時の減衰                             |
| `SPRING_MOTOR_MAX_FORCE`           | `20000` | 仮定                          | モーターの最大力（N）                    |
| `PIVOT_RELEASE_EXTENSION_FRACTION` | `0.5`   | 仮定                          | 伸びきる前に先端ピボットを外す割合       |

### チャージ・着地猶予・接地時間

| 定数名                                      | 値    | 区分                       | 説明                                                |
| ------------------------------------------- | ----- | -------------------------- | --------------------------------------------------- |
| `CHARGE_FULL_MS`                            | `45`  | 仮定                       | チャージ量が最大になる押下時間（ms）                |
| `JUMP_PRE_LANDING_BUFFER_MS`                | `120` | 仮定                       | 着地直前に押した Space をチャージとして拾う窓（ms） |
| `GROUND_CONTACT_BASE_MS`                    | `90`  | 仮定（定性のみ出典 4, 17） | 先端接地時間の基本値（ms）                          |
| `GROUND_CONTACT_FALL_MS_PER_100_PX_PER_SEC` | `12`  | 仮定（定性のみ出典 4, 17） | 衝突速度 100px/s あたりに足す接地時間（ms）         |
| `GROUND_CONTACT_MAX_MS`                     | `400` | 仮定                       | 接地時間の上限（ms）                                |

### 回転

出典 7・14 は入力 % が turning speed へ写像されると述べるだけで、最大角速度・角加速度・離鍵後の減衰は公開していません。以下はすべて仮定です。

| 定数名                                | 値     | 説明                                     |
| ------------------------------------- | ------ | ---------------------------------------- |
| `ROTATION_MAX_DEG_PER_SEC`            | `480`  | `A` / `D` 100% 入力時の目標角速度        |
| `ROTATION_ACCEL_DEG_PER_SEC2`         | `4800` | 目標角速度へ加速する角加速度             |
| `ROTATION_RELEASE_DECEL_DEG_PER_SEC2` | `4000` | 離鍵後に 0 へ減速する角加速度            |
| `BOUNCE_ANGULAR_KEEP`                 | `0.7`  | クリーンな先端離陸で持ち越す角速度の割合 |

### 着地・失敗着地・ピボット

| 定数名                                    | 値     | 区分                      | 説明                                              |
| ----------------------------------------- | ------ | ------------------------- | ------------------------------------------------- |
| `BOOST_ROTATION_DEGREES`                  | `285`  | 出典 3–5, 10 / 実装は仮定 | ブースト成立に必要な空中累積回転角（度）          |
| `TIP_ALIGN_MAX_ANGLE_DEG`                 | `50`   | 仮定（定性のみ出典 8）    | スティック軸と着地面法線の許容ずれ角（度）        |
| `TIP_PIVOT_MAX_SLOPE_DEG`                 | `55`   | 仮定                      | 先端ピボットを解除する斜面の上限（度）            |
| `TIP_PIVOT_MAX_FORCE_N`                   | `60`   | 仮定                      | 先端ピボットを解除する横力の上限（N）             |
| `OUCH_BODY_LINEAR_KEEP`                   | `0.05` | 仮定（出典 11 / 22 は定性） | 体ヒット時に残す線形速度の割合（restitution 0 のとき） |
| `OUCH_BODY_RESTITUTION`                   | `0`    | 仮定（反射式は未確認）    | 0 は運動量カット、1 は法線反射。既定は出典 11 / 22 に合わせ 0 |
| `OUCH_GLANCING_LINEAR_KEEP`               | `0.3`  | 仮定                      | 角度不足の先端ヒットで残す線形速度の割合          |
| `OUCH_RESIDUAL_BOUNCE_SPEED_M_PER_SEC`    | `0.36` | 仮定                      | 失敗着地で埋まり込みを避ける微小な分離速度（m/s） |
| `OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC` | `180`  | 仮定                      | 体ヒット時に加える角速度インパルス                |
| `OUCH_FLASH_MS`                           | `260`  | 仮定                      | 失敗着地の赤フラッシュ表示時間                    |

失敗着地は、体ヒットでブーストを取消し、既存の角速度を保ったまま小さな角インパルスを足します。`OUCH_BODY_RESTITUTION = 0`（既定）では線形速度をほぼゼロにします（出典 11 / 22）。1 に近づけると速度を接触法線で鏡映しますが、この反射モデルは仮定です。角度不足の先端ヒットは体ヒットより運動量を残します。操作ロック・スタン・自動直立はありません（仮定）。

### 地形・ステージ・カメラ

| 定数名                   | 値     | 区分                     | 説明                                     |
| ------------------------ | ------ | ------------------------ | ---------------------------------------- |
| `TERRAIN_SAMPLE_STEP_PX` | `8`    | 仮定                     | SVG `<path>` のサンプリング間隔（px）    |
| `TERRAIN_MIN_EDGE_PX`    | `2`    | 仮定                     | 捨てる最小の辺長（px）                   |
| `KILL_PLANE_MARGIN`      | `80`   | 仮定                     | ステージ境界から外れた際のリスポーン余白 |
| `CAMERA_PAN_SPEED`       | `420`  | 仮定（移動自体は出典 8） | カメラ先読み速度（px/秒）                |
| `CAMERA_PAN_LIMIT`       | `320`  | 仮定                     | カメラ先読みオフセットの上限（px）       |
| `W_S_CAMERA_PAN`         | `true` | 仮定                     | `W` / `S` の上下先読みを割り当てる       |
| `GRID_CELL_PX`           | `40`   | 仮定                     | 背景グリッドの間隔（px）                 |

## 5. 純粋関数の仕様

物理エンジンや DOM に依存しない純粋関数を中心に実装し、単体テストで挙動を検証します。Rapier の初期化が要るテストだけ `await init()` を待ちます。

- **`charge.ts`**
  - `computeContactDurationMs(impactSpeedPxPerSec)`: 基本 90ms に衝突速度 100px/s あたり 12ms を足し、400ms でクランプします。
  - `computeContactChargeMs(timing, contactStartMs)`: 接地時点で押していれば押下開始からの時間、着地前に離していれば `JUMP_PRE_LANDING_BUFFER_MS` 以内なら押下していた時間、それ以外は 0 を返します。
  - `computeChargeLevel(chargeMs)`: `CHARGE_FULL_MS` で 1 に飽和します。
  - `computeCompressionPx(level, boosted)`: 無チャージからチャージ済みへ線形に動かし、ブースト時は `BOOST_COMPRESSION_PX` を返します。
- **`pivot.ts`**
  - `evaluateTipPivot({ grounded, slopeDeg, lateralForceN })`: 空中・急斜面・過大な横力で解除し、それ以外は固定します。
  - `estimatePivotLateralForceN(input)`: 斜面方向の重力成分と、指令した角加速度 × 重心距離から横力を推定します。
- **`landing.ts`**
  - `classifyLanding(contactPart, alignmentAngleDeg)`: 胴体接地は `"ouch"`、先端で `|angle| <= TIP_ALIGN_MAX_ANGLE_DEG` なら `"clean"`、超過なら `"glancing"`。
  - `resolveLanding(input)`: クリーンならバウンドサイクル開始、失敗なら線形速度の減衰・微小分離速度・角速度の保持／角インパルス・ブースト取消を返します。
- **`boost.ts`**
  - `accumulateAirborneRotation(state, deltaDeg, thresholdDeg)`: 空中の回転増分を符号付きで累積し、絶対値が `285°` 以上で成立させます。追加回転では増強しません。
  - `handleContactBoost(state, { isTipContact, jumpHeld })`: 先端以外の接地、またはチャージ中に `jumpHeld` が false なら取消します。
  - `consumeBoostOnLaunch(state, jumpHeld)`: `ready && jumpHeld` のときだけブーストし、状態を初期化します。
- **`rotation.ts`**
  - `stepAngularVelocity(currentDegPerSec, inputDir, dtSec, model)`: 目標角速度へ加減速し、入力 0 なら減速して 0 へ戻します。最大速度を超える既存のスピンは滑らかに寄せます。
- **`coords.ts`**
  - `pxToMeters` / `metersToPx` / `stagePointToRapier` / `rapierPointToStage` / `stageAngleToRapier` / `rapierAngleToStage`: px・Y 下向き・時計回りと、メートル・Y 上向き・反時計回りの変換。
  - `pogoUpVector` / `alignmentDegrees` / `normalImpactSpeed` / `slopeDegFromUpNormal`: 姿勢と接触法線の幾何。
  - `lerpAngleShortArc` / `lerpPose`: 直近 2 姿勢の補間。
- **`polyline.ts`**
  - `filterPolylinePoints` / `buildPolylineGeometry` / `toRapierPolyline`: 短い辺を捨て、閉じたパスは最後→最初の辺を足し、`ColliderDesc.polyline` 用の頂点・インデックスを作ります。
- **`respawn.ts`**
  - `shouldCountFall(reason)`: `"fall"` だけ落下回数に数えます。`"manual"` は数えません。

## 6. PoC アーキテクチャ

- **物理と描画の分離**: 物理は `src/lib/pogo/simulate.ts`（アキュムレータ・補間・スナップショット）、`cycle.ts`（固定ステップの状態機械）、`contact.ts`（接地判定・ピボット・失敗着地）、`rapier-world.ts`（剛体・ジョイント・地形コライダー）に限定します。描画は DOM と SVG のみです。
- **遅延ロードの境界**: `@dimforge/rapier2d` を import するのは `rapier-load.ts` だけで、しかも `import()` です。`src/routes/pogo/+page.svelte` は `onMount` 内で `import("../../lib/pogo/simulate")` を呼びます。他ルート・レイアウト・SSR / Worker バンドルへ物理エンジンを含めません。
- **CSP**: `kit.csp` の `script-src` は `main` と同じ `self`（と nonce）のままです。`wasm-unsafe-eval` は `hooks.server.ts` が `/pogo` の既存 CSP ヘッダへだけ足します。他ルートの CSP は変えません。
- **チューニングパネル**: `?debug=1` または `?tune=1` のときだけ、仮定定数のスライダーを遅延ロードします。既定値の唯一のソースは `constants.ts` で、スライダーは `mergeTune` の overrides を sim に渡すだけです。
- **120Hz 固定ステップと補間描画**: rAF ごとに経過時間をアキュムレータへ足し、`FIXED_STEP_MS` 分だけ `world.step()` を 0 回以上実行します。1 フレームのステップ数は `MAX_PHYSICS_STEPS_PER_FRAME`、dt は `MAX_FRAME_DT_MS` で上限します。物理が 0 回のフレームでも描画し、`alpha` で直近 2 姿勢を補間します。
- **接地と離陸**: 先端コンタクトの立ち上がりでチャージを開始し、接触窓の終わりか Space の早期解放でモーターを自然長へ戻します。伸びが `PIVOT_RELEASE_EXTENSION_FRACTION` に達したら先端ピボットを外します。接触の取得と状態遷移は `world.step()` の後に行い、イベント配信中にジョイントを触りません。
- **描画**: 胴体・軸・先端の 3 つの div を毎フレーム `transform` だけで更新します。カメラは `#world` へ逆向きの `translate3d` を適用します。
- **衝突デバッグ表示**: `?debug=1` のときだけ、Rapier のポリライン地形をステージ SVG と同じ座標空間へ `<polygon>` として重ねます。
- **スポーンとリスポーン**: 先端下端がスタートパッド `y = 860` に接するようスポーンします。初期角度 0、速度 0 です。`R` と UI のリセットは `respawn("manual")` を呼び、落下回数を増やしません。キルプレーン越えだけが `respawn("fall")` で増やします。手動リセット後も最初の接地点で自動バウンドが始まります（Matter 時代の再発火回避の回避策は不要になりました）。`resetCount` でカメラをスポーンへ戻します。
- **入力**:
  - `A` / `D`: 左右回転（接地中は先端を支点に回る）。
  - `Space`: チャージ・跳躍。`event.code === "Space"` と `event.key === " "` の両方を拾い、`preventDefault()` します。リセットボタンは押下後に blur します。
  - `W` / `S` および矢印キー: カメラパン。
  - `R`: スタート地点への手動リスポーン。

## 7. スコープ外

- エモート（`E` キー）およびスケートモード
- 連続ブーストによるジャンプ力の段階的増加（出典 13 は未確認のため不採用）
- グローバルナビゲーションおよび `/sitemap.xml` への `/pogo` 登録
