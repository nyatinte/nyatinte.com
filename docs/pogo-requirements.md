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

## 2. 確定した仕様（出典あり）

- **自動バウンド**: ポゴ先端が地形へ着地するたびに自動で跳ねます。ボタン無操作でも跳び続けます（出典 8, 9）。
- **ジャンプチャージと hop**: ジャンプボタン（Space）を押し続けると着地時のジャンプ力が上がります。早く離すと短い hop になります（出典 4, 8, 11）。
- **空中回転**: 空中で `A` / `D` を押し続けて機体を傾け・回転させます。地面を離れた瞬間から回し始めるのが基本です（出典 3, 4, 8）。
- **入力と回転速度**: アナログ入力の 0–100% はトルクではなく回転速度（turning speed）へ写像されます。オプションメニューの回転する顔も同じ計算を使っています（出典 7, 14）。キーボード `A` / `D` の最大角速度・角加速度・離鍵後の減衰の数値は公開されていません。
- **ブースト条件（285°）**: 空中で累積回転角が約 `285°` に達するとブーストが成立します（ゲーム内では「360°」と表現されますが、開発者は実測条件が `285°` であると明言しています）。達成すると先端にチャージ演出が出ます（出典 3, 4, 5, 8, 10）。
- **ブースト発動と取消**:
  - 次ジャンプのチャージ中にジャンプボタンを早く離すとブーストはキャンセルされます（出典 3, 4, 5）。
  - ブースト成立後にポゴ先端以外が地形に触れるとブーストを失います（出典 5）。
  - ジャンプを押したまま先端だけで着地すると、次のジャンプがブーストジャンプになります（出典 5, 8）。
- **追加回転の扱い**: `720°` などの追加回転を行っても通常モードのブースト威力は増加しません（出典 6）。
- **落下と接地時間・反発**: 深い落下ほど接地時間が長くなり、次ジャンプの狙いを合わせる余裕が増えます（出典 4）。落下の勢い・高さは着地後のジャンプ力に寄与します（出典 1, 8, 10, 11）。
- **失敗着地（Ouch）**: 先端以外での着地、または先端でも着地面に対する角度が不足した着地ではバランスを失います（Ouch）。壁や天井でも先端着地が成立すれば跳ねます（出典 8, 11）。
- **体ヒットと運動量**: 体が崖などの地形に当たると運動量をすべて失います（出典 11）。先端以外が地形に触れるとブーストを失います（出典 5）。
- **既定操作とカメラ**: 既定の操作は `A`（左傾け）、`D`（右傾け）、`Space`（ジャンプ）です。矢印キーでカメラを動かし、周囲の先読みができます（出典 8）。
- **未採用事項**: 連続ブーストでジャンプ力が育つ説（出典 13）は開発者確認が取れていないため採用しません。`E` のエモート（出典 8）とスケートモードは PoC の対象外です。

## 3. 仮定と定数一覧

公式の数値式・物理パラメータは非公開です。PoC を成立させるための初期値と計算ルールはすべて「仮定」として `src/lib/pogo/constants.ts` にまとめます。

### 固定ステップと 120Hz

| 定数名                        | 値         | 区分 | 説明                                                                                |
| ----------------------------- | ---------- | ---- | ----------------------------------------------------------------------------------- |
| `FIXED_STEP_HZ`               | `120`      | 仮定 | 物理の固定ステップ周波数。公式の内部 tick は非公開のため、依頼どおり 120Hz にします |
| `FIXED_STEP_MS`               | `1000/120` | 仮定 | 1 ステップの時間（ms）。アキュムレータで 0..N 回 `Engine.update` します             |
| `MAX_FRAME_DT_MS`             | `50`       | 仮定 | 1 フレームで取り込む最大経過時間（ms）。タブ復帰時の巨大な dt を捨てます            |
| `MAX_PHYSICS_STEPS_PER_FRAME` | `8`        | 仮定 | 1 フレームで回す物理ステップの上限。スパイラル・オブ・デスを防ぎます                |
| `MATTER_BASE_DELTA_MS`        | `1000/60`  | 仕様 | Matter.js 0.20 の速度基準ステップ（ms）。`Body.setVelocity` の速度単位の基準        |
| `MATTER_GRAVITY_SCALE`        | `0.001`    | 仕様 | Matter.js 0.20 の既定重力スケール                                                   |

### プレイヤーと地形

| 定数名                | 値     | 区分 | 説明                                                             |
| --------------------- | ------ | ---- | ---------------------------------------------------------------- |
| `GRAVITY_Y`           | `1.6`  | 仮定 | Matter.js の重力 Y（DOM と同じく下向き正）。`1600px/s²` に相当   |
| `PLAYER_WIDTH`        | `18`   | 仮定 | 胴体の当たり判定幅（px）                                         |
| `PLAYER_HEIGHT`       | `44`   | 仮定 | 胴体の当たり判定高さ（px）。コミュニティの体高 1.5m に対応させる |
| `STICK_LENGTH`        | `36`   | 仮定 | ポゴ軸の長さ（px）                                               |
| `TIP_RADIUS`          | `5`    | 仮定 | ポゴ先端円の半径（px）                                           |
| `PLAYER_FRICTION_AIR` | `0`    | 仮定 | 空中の線形減衰。空気抵抗の出典がないため 0（運動量を保存）       |
| `TIP_FRICTION`        | `0.05` | 仮定 | 先端の摩擦係数（斜面での滑りを許容）                             |
| `BODY_FRICTION`       | `0.45` | 仮定 | 胴体・軸の摩擦係数                                               |

### ジャンプ高さ（非公式コミュニティ測定と仮定）

出典 15 は「Pogo Guy はほぼ 1.5m」「base jump 5m、boost jump 7m」と書く非公式のコミュニティ測定です。全文は Reddit のログイン壁で取得できず、公開検索スニペットからの引用です。`PLAYER_HEIGHT = 44px` を 1.5m に対応させる仮定のもとで、以下を目標にします。

| 定数名                        | 値             | 区分                              | 説明                                                                        |
| ----------------------------- | -------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `UNCHARGED_APEX_BODY_HEIGHTS` | `2`            | 出典なし・仮定                    | 無チャージ hop の到達高（体高比）。`88px`                                   |
| `CHARGED_APEX_BODY_HEIGHTS`   | `5/1.5 ≈ 3.33` | 非公式（出典 15）・対応は仮定     | コミュニティの "base jump" 5m をチャージ hop に対応させたもの。`約146.7px`  |
| `BOOST_APEX_BODY_HEIGHTS`     | `7/1.5 ≈ 4.67` | 非公式（出典 15）・対応は仮定     | コミュニティの boost jump 7m。`約205.3px`                                   |
| `UNCHARGED_APEX_PX`           | `88`           | 導出                              | `PLAYER_HEIGHT * UNCHARGED_APEX_BODY_HEIGHTS`                               |
| `CHARGED_APEX_PX`             | `約146.7`      | 導出                              | 同上                                                                        |
| `BOOST_APEX_PX`               | `約205.3`      | 導出                              | 同上                                                                        |
| `AUTO_BOUNCE_SPEED`           | `約8.956`      | 導出                              | `UNCHARGED_APEX_PX` から逆算したバウンド速度（Matter 速度単位）             |
| `CHARGED_BOUNCE_SPEED`        | `約11.530`     | 導出                              | `CHARGED_APEX_PX` から逆算                                                  |
| `BOOST_BOUNCE_SPEED`          | `約13.622`     | 導出                              | `BOOST_APEX_PX` から逆算                                                    |
| `BOOST_BOUNCE_MULTIPLIER`     | `約1.181`      | 導出                              | `BOOST_BOUNCE_SPEED / CHARGED_BOUNCE_SPEED`                                 |
| `MAX_BOUNCE_SPEED`            | `約13.622`     | 仮定                              | バウンド速度の上限。ブースト速度と同じにし、単発ブーストを `205px` に抑える |
| `FALL_SPEED_BOUNCE_SCALE`     | `0.35`         | 仮定（定性のみ出典 1, 8, 10, 11） | 現在の hop の落下速度を超えた分だけバウンド速度へ加算する係数               |

到達高は Matter.js 0.20 の Verlet 積分順序を含む閉形式 `V²/(2g) − V·Δt/2`（`V` は px/s、`Δt = 1/120s`）で求めます。実機の Matter 120Hz で 3 回ずつ測った到達高は `88.012 / 146.672 / 205.345px`、ばらつきは 0 でした。空気抵抗は `PLAYER_FRICTION_AIR = 0` のため含みません。

### 回転（仮定）

出典 7・14 は入力 % が turning speed へ写像されると述べるだけで、最大角速度・角加速度・離鍵後の減衰・地上と空中の差は公開していません。以下はすべて仮定です。

| 定数名                                | 値     | 区分 | 説明                                                                 |
| ------------------------------------- | ------ | ---- | -------------------------------------------------------------------- |
| `ROTATION_MAX_DEG_PER_SEC`            | `480`  | 仮定 | `A` / `D` 100% 入力時の目標角速度。通常 hop の滞空中に 285° を回せる |
| `ROTATION_ACCEL_DEG_PER_SEC2`         | `4800` | 仮定 | 目標角速度へ加速する角加速度。最大到達まで約 0.1s                    |
| `ROTATION_RELEASE_DECEL_DEG_PER_SEC2` | `4000` | 仮定 | 離鍵後に 0 へ減速する角加速度。停止まで約 0.12s                      |
| `BOUNCE_ANGULAR_KEEP`                 | `0.7`  | 仮定 | クリーンな先端バウンドで持ち越す角速度の割合                         |

地上（圧縮中）と空中で同じ最大角速度・角加速度を使います（差の出典なし）。圧縮中も回転でき、次ジャンプの狙いを合わせられます。

### 着地と接地

| 定数名                                    | 値     | 区分                              | 説明                                                         |
| ----------------------------------------- | ------ | --------------------------------- | ------------------------------------------------------------ |
| `BOOST_ROTATION_DEGREES`                  | `285`  | 出典 3–5, 10 / 実装詳細は仮定     | ブースト成立に必要な空中累積回転角（度）                     |
| `TIP_ALIGN_MAX_ANGLE_DEG`                 | `50`   | 仮定（定性のみ出典 8）            | スティック上向き軸と着地面外向き法線の許容ずれ角（度）       |
| `OUCH_BODY_LINEAR_KEEP`                   | `0.05` | 仮定（「運動量を失う」は出典 11） | 体ヒット時に残す線形速度の割合。ほぼ 0                       |
| `OUCH_GLANCING_LINEAR_KEEP`               | `0.3`  | 仮定                              | 角度不足の先端ヒットで残す線形速度の割合。体ヒットより緩い   |
| `OUCH_RESIDUAL_BOUNCE_SPEED`              | `0.6`  | 仮定                              | 失敗着地で埋まり込みを避けるため法線方向へ残す微小な分離速度 |
| `OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC` | `180`  | 仮定                              | 体ヒット時に加える角インパルス。既存の角速度はゼロにしない   |
| `OUCH_FLASH_MS`                           | `260`  | 仮定                              | 失敗着地の赤フラッシュ表示時間。操作・物理には影響しない     |
| `COMPRESSION_HORIZONTAL_DAMP`             | `0.75` | 仮定                              | 先端圧縮中に残す水平速度の割合                               |
| `GROUND_CONTACT_BASE_MS`                  | `90`   | 仮定                              | 先端接地（圧縮）時間の基本値（ms）                           |
| `GROUND_CONTACT_FALL_MS_PER_SPEED`        | `12`   | 仮定（定性のみ出典 4）            | 衝突速度あたりに追加する接地時間（ms）                       |

失敗着地の詳細（ラグドールか引っかかりか、自動起き上がりの有無、操作ロックの有無、反発係数）は公式・信頼できる二次資料のどちらにも記述がありません。PoC では次を仮定します。

- 体ヒットは線形速度をほぼゼロにし、ブーストを取消し、圧縮／バウンドサイクルを開始しない。
- 角度不足の先端ヒットも失敗着地だが、残す運動量は体ヒットより多い。
- 既存の角速度はゼロにせず、体ヒット時は小さな角インパルスを足して倒れ込む。
- 操作はロックしない。自動で直立へスナップしない。回復はプレイヤーが `A` / `D` で先端を下へ戻し、クリーンな先端着地をするまで待つ。

### ステージ・カメラ・グリッド

| 定数名                | 値      | 区分                                 | 説明                                                                                |
| --------------------- | ------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `PATH_SAMPLE_SPACING` | `8`     | 仮定                                 | SVG `<path>` サンプリング間隔（px）                                                 |
| `KILL_PLANE_MARGIN`   | `80`    | 仮定                                 | ステージ境界から外れた際にリスポーンする余白（px）                                  |
| `CAMERA_PAN_SPEED`    | `420`   | 仮定（矢印キーでの移動自体は出典 8） | カメラ先読み速度（px/秒）                                                           |
| `CAMERA_PAN_LIMIT`    | `320`   | 仮定                                 | カメラ先読みオフセットの上限（px）                                                  |
| `W_S_CAMERA_PAN`      | `true`  | 仮定                                 | 本家に `W` / `S` 移動の出典がないため、`W`（上見渡し）/ `S`（下見渡し）を割り当てる |
| `GRID_CELL_PX`        | `40`    | 仮定                                 | 背景グリッドの間隔（px）                                                            |
| `GRID_MIN_X`          | `-4000` | 仮定                                 | グリッド左端（world 座標）                                                          |
| `GRID_MAX_X`          | `6000`  | 仮定                                 | グリッド右端                                                                        |
| `GRID_MIN_Y`          | `-4000` | 仮定                                 | グリッド上端                                                                        |
| `GRID_MAX_Y`          | `4000`  | 仮定                                 | グリッド下端                                                                        |

## 4. 純粋関数の仕様

物理エンジンや DOM に依存しない純粋関数として、以下を実装し単体テストで挙動を検証します。

- **`src/lib/pogo/boost.ts`**:
  - `createBoostState()`: 累積角 `0`、未成立の初期状態を返します。
  - `accumulateAirborneRotation(state, deltaDeg, thresholdDeg)`: 空中の回転増分を符号付きで累積し、`Math.abs(accumulatedDeg) >= thresholdDeg` でブースト成立（`ready: true`）にします。一度成立した後の微調整の逆回転や `720°` 以上の追加回転では状態を増強しません。
  - `cancelBoost()`: 累積角と成立フラグを初期化します。
  - `handleContactBoost(state, { isTipContact, jumpHeld })`: 先端以外の接地、または接地チャージ中に `jumpHeld` が `false` になった場合は `cancelBoost()` で取り消します。
  - `consumeBoostOnLaunch(state, jumpHeld)`: 跳躍時に `state.ready && jumpHeld` であれば `boosted: true` を返し、状態を初期化します。
- **`src/lib/pogo/impulse.ts`**:
  - `computeContactDurationMs(impactSpeed)`: `GROUND_CONTACT_BASE_MS + Math.max(0, impactSpeed) * GROUND_CONTACT_FALL_MS_PER_SPEED` を返します。
  - `computeBounce({ impactSpeed, jumpHeld, boostReady })`: クリーンな先端着地のバウンド速度を返します。`usedBoost = jumpHeld && boostReady` に応じた基本速度（`AUTO_BOUNCE_SPEED` / `CHARGED_BOUNCE_SPEED` / `CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER`）に、現在の hop の落下速度を超えた分だけ `FALL_SPEED_BOUNCE_SCALE` を掛けて加え、`MAX_BOUNCE_SPEED` でクランプします。通常の hop では落下速度が基本速度以下なので、跳ねるたびに高くはなりません。
- **`src/lib/pogo/landing.ts`**:
  - `classifyLanding(contactPart, alignmentAngleDeg)`: 胴体接地は `"ouch"`、先端接地で `|alignmentAngleDeg| <= TIP_ALIGN_MAX_ANGLE_DEG` なら `"clean"`、超過なら `"glancing"` を返します。
  - `resolveLanding(input)`: クリーンな先端着地ならバウンドサイクル開始、失敗着地なら線形速度の減衰・微小分離速度・角速度の保持／角インパルス・ブースト取消を返します。角度の自動リセットや操作ロックは行いません。
- **`src/lib/pogo/rotation.ts`**:
  - `stepAngularVelocity(currentDegPerSec, inputDir, dtSec, model)`: 入力方向を目標角速度へ写像し、`accelDegPerSec2` で加減速します。入力が 0 なら `releaseDecelDegPerSec2` で 0 へ戻します。最大速度を超える既存のスピンは瞬間的にクランプせず滑らかに目標へ寄せます。
  - `degPerSecToMatterAngularVelocity` / `matterAngularVelocityToDegPerSec`: Matter.js 0.20 の `Body.setAngularVelocity` 単位（`Body._baseDelta` あたりのラジアン）との変換。
  - `lerpAngleShortArc` / `lerpPose`: 直近 2 つの物理姿勢を短い弧で補間します。
- **`src/lib/pogo/jump.ts`**:
  - `computeJumpApexPx(bounceSpeed, model)`: Matter.js 0.20 の Verlet 積分順序を含む到達高の閉形式。
  - `computeBounceSpeedForApexPx(apexPx, model)`: 目標到達高からバウンド速度を逆算します。
- **`src/lib/pogo/respawn.ts`**:
  - `shouldCountFall(reason)`: `"fall"`（キルプレーン落下）だけ `true` を返します。手動リセット `"manual"` は `false` です。

## 5. PoC アーキテクチャ

- **物理と描画の分離**: 衝突判定と時間積分は `matter-js` + `poly-decomp`（`src/lib/pogo/simulate.ts`、`simulate-bodies.ts`、`simulate-collision.ts` のみが参照）に限定し、描画は DOM + SVG のみに分離します。
- **遅延ロードの境界**: `matter-js` と `poly-decomp` をトップレベルで import するのは上記の物理モジュールのみとします。`src/routes/pogo/+page.svelte` は `onMount` 内で `import("../../lib/pogo/simulate")` を動的に呼び出し、他ルート・レイアウト・SSR バンドルへ物理エンジンを含めません。
- **120Hz 固定ステップと補間描画**: rAF ごとに経過時間をアキュムレータへ足し、`FIXED_STEP_MS` 分だけ `Engine.update(engine, 1000/120)` を 0 回以上実行します。1 フレームのステップ数は `MAX_PHYSICS_STEPS_PER_FRAME` で上限し、dt は `MAX_FRAME_DT_MS` でクランプします。物理が 0 回のフレームでも描画は毎回行い、`alpha = accumulatorMs / FIXED_STEP_MS` で直近 2 姿勢を補間します。角度は短い弧で補間します。スナップショットには累積 `physicsStepCount` と `fixedStepHz` を含め、`?debug=1` の HUD で確認できます。
- **回転**: 毎ステップ `Body.setAngularVelocity` で目標角速度を与え、Matter に積分させます。`Body.setAngle` と `Body.setAngularVelocity(0)` による毎ステップの上書きは行いません。圧縮中も同じ回転モデルで狙いを合わせられます。クリーンな先端バウンドでは `BOUNCE_ANGULAR_KEEP` の割合だけ角速度を持ち越します。
- **失敗着地**: `resolveLanding` が体ヒット／角度不足の先端ヒットを判定し、線形速度をほぼゼロにし、ブーストを取消し、既存の角速度を保ったまま小さな角インパルスを加えます。圧縮／バウンドサイクルは開始しません。赤フラッシュは表示のみで、操作ロックやスタンタイマーはありません。
- **SVG 地形の物理化（`src/lib/pogo/svg-terrain.ts`）**: 閉じた（または端点接続で閉路化した）`<path data-terrain>` 要素を `getTotalLength()` と `getPointAtLength()` で `PATH_SAMPLE_SPACING` 間隔で点列化し、`path.getScreenCTM()` と `#world` 要素の矩形から変換行列を作って `#world` 座標系へ変換します。`simulate-bodies.ts` 側で `Common.setDecomp(decomp)` を設定した上で `Bodies.fromVertices` により静的剛体を生成し、バウンディングボックスを元の頂点群へ位置合わせします。
- **単一 `div` と `#world` カメラ**: プレイヤーは `#world` 内の単一 `<div>` として描画し、毎フレーム `transform: translate3d(...) rotate(...)` のみを更新します（`top` / `left` による座標指定は行いません）。カメラは `#world` へ逆向きの `translate3d(...)` を適用してプレイヤー位置とパンオフセットを追従させます。
- **背景グリッド**: `#world` 内に `GRID_MIN_X..GRID_MAX_X` × `GRID_MIN_Y..GRID_MAX_Y` の CSS グリッドを敷き、ステージ SVG の外側でもグリッドが見えるようにします。カメラと `.pogo-viewport` の `overflow: hidden` は維持します。
- **衝突デバッグ表示**: `?debug=1` のときだけ、Matter の静的な地形剛体の頂点をステージ SVG と同じ座標空間へ `<polygon>` として重ねます。通常プレイでは取得・描画しません。
- **スポーンとリスポーン**: プレイヤーの合成剛体の重心から先端下端までの距離を計算し、スポーン時点で先端下端がスタートパッド `y = 860` に接するように `spawn.y` を決めます。初期角度は 0、速度は 0 です。`R` キーと UI のリセットボタンは `respawn("manual")` を呼び、落下回数を増やしません。キルプレーンを越えた自動リスポーンだけが `respawn("fall")` として落下回数を増やします。手動リセットでもカメラがスポーンへ戻るよう、スナップショットの `resetCount` を別に持ちます。
- **入力・ステージ**:
  - `A` / `D`: 左右回転（圧縮中も次の跳躍角の狙い合わせが可能、仮定）。
  - `Space`: チャージ・跳躍（`keydown` / `keyup` で `preventDefault()` し、ページスクロールを防止）。
  - `W` / `S` および矢印キー: カメラパン（`W` / `S` 割り当ては `W_S_CAMERA_PAN` による仮定）。
  - `R`: スタート地点への手動リスポーン（PoC の UI 補助。Pogostuck の仕様ではなく、落下回数にも数えません）。
  - ステージはスタート台、通常／チャージで登れる段差、ギャップ、斜面、および `285°` ブーストジャンプで到達できる高台ゴールで構成し、ステージ境界から `KILL_PLANE_MARGIN` を超えて落下した場合はスタート地点へ自動リスポーンします。

## 6. スコープ外

- エモート（`E` キー）およびスケートモード
- 連続ブーストによるジャンプ力の段階的増加（出典 13 は未確認のため不採用）
- グローバルナビゲーションおよび `/sitemap.xml` への `/pogo` 登録
