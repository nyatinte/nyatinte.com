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

## 2. 確定した仕様（出典あり）

- **自動バウンド**: ポゴ先端が地形へ着地するたびに自動で跳ねます。ボタン無操作でも跳び続けます（出典 8, 9）。
- **ジャンプチャージと hop**: ジャンプボタン（Space）を押し続けると着地時のジャンプ力が上がります。早く離すと短い hop になります（出典 4, 8, 11）。
- **空中回転**: 空中で `A` / `D` を押し続けて機体を傾け・回転させます。地面を離れた瞬間から回し始めるのが基本です（出典 3, 4, 8）。
- **ブースト条件（285°）**: 空中で累積回転角が約 `285°` に達するとブーストが成立します（ゲーム内では「360°」と表現されますが、開発者は実測条件が `285°` であると明言しています）。達成すると先端にチャージ演出が出ます（出典 3, 4, 5, 8, 10）。
- **ブースト発動と取消**:
  - 次ジャンプのチャージ中にジャンプボタンを早く離すとブーストはキャンセルされます（出典 3, 4, 5）。
  - ブースト成立後にポゴ先端以外が地形に触れるとブーストを失います（出典 5）。
  - ジャンプを押したまま先端だけで着地すると、次のジャンプがブーストジャンプになります（出典 5, 8）。
- **追加回転の扱い**: `720°` などの追加回転を行っても通常モードのブースト威力は増加しません（出典 6）。
- **落下と接地時間・反発**: 深い落下ほど接地時間が長くなり、次ジャンプの狙いを合わせる余裕が増えます（出典 4）。落下の勢い・高さは着地後のジャンプ力に寄与します（出典 1, 8, 10, 11）。
- **非先端・角度不足着地（Ouch）**: 先端以外での着地、または先端でも着地面に対する角度が不足した着地ではバランスを失います（Ouch）。壁や天井でも先端着地が成立すれば跳ねます（出典 8, 11）。
- **既定操作とカメラ**: 既定の操作は `A`（左傾け）、`D`（右傾け）、`Space`（ジャンプ）です。矢印キーでカメラを動かし、周囲の先読みができます（出典 8）。
- **未採用事項**: 連続ブーストでジャンプ力が育つ説（出典 13）は開発者確認が取れていないため採用しません。`E` のエモート（出典 8）とスケートモードは PoC の対象外です。

## 3. 仮定と定数一覧

公式の数値式・物理パラメータは非公開です。PoC を成立させるための初期値と計算ルールはすべて「仮定」として `src/lib/pogo/constants.ts` にまとめます。

| 定数名                             | 初期値 | 区分                                 | 説明                                                                                                                             |
| ---------------------------------- | ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `BOOST_ROTATION_DEGREES`           | `285`  | 値: 出典 3–5, 10 / 実装詳細: 仮定    | ブースト成立に必要な空中累積回転角（度）。時計回り・反時計回りのどちらでも累積し、符号付き累積で往復揺らしによる誤発動を防ぎます |
| `ROTATION_SPEED_DEG_PER_SEC`       | `480`  | 仮定                                 | `A` / `D` 押下時の回転角速度（度/秒）。通常 hop の滞空中に 285° を回し切れる値                                                   |
| `AUTO_BOUNCE_SPEED`                | `11`   | 仮定                                 | 無チャージ先端着地時の基本バウンド速度（Matter 固定ステップ速度）                                                                |
| `CHARGED_BOUNCE_SPEED`             | `16`   | 仮定                                 | `Space` 押下チャージ時の基本バウンド速度                                                                                         |
| `BOOST_BOUNCE_MULTIPLIER`          | `2.15` | 仮定                                 | ブースト発動時に `CHARGED_BOUNCE_SPEED` へ掛ける倍率                                                                             |
| `FALL_SPEED_BOUNCE_SCALE`          | `0.35` | 仮定（定性のみ出典 1, 8, 10, 11）    | 法線方向の衝突速度に応じてバウンド速度へ加算する係数                                                                             |
| `MAX_BOUNCE_SPEED`                 | `42`   | 仮定                                 | バウンド速度の上限                                                                                                               |
| `TIP_ALIGN_MAX_ANGLE_DEG`          | `50`   | 仮定（定性のみ出典 8）               | スティック上向き軸と着地面外向き法線の許容ずれ角（度）                                                                           |
| `TIP_FRICTION`                     | `0.05` | 仮定                                 | ポゴ先端パーツの摩擦係数（斜面での滑りを許容）                                                                                   |
| `BODY_FRICTION`                    | `0.45` | 仮定                                 | 胴体・軸パーツの摩擦係数                                                                                                         |
| `OUCH_BOUNCE_SCALE`                | `0.15` | 仮定                                 | 非先端・角度不足着地（Ouch / Glancing）時に残す法線反発の割合                                                                    |
| `OUCH_RECOVERY_MS`                 | `260`  | 仮定                                 | 非先端着地（Ouch）後、空中のブースト累積を止め、回転を弱める時間（ms）                                                           |
| `OUCH_ROTATION_SCALE`              | `0.6`  | 仮定                                 | Ouch 回復中の回転速度倍率                                                                                                        |
| `OUCH_BODY_HORIZONTAL_DAMP`        | `0.5`  | 仮定                                 | 胴体ヒット時に残す水平速度の割合                                                                                                 |
| `OUCH_GLANCING_HORIZONTAL_DAMP`    | `0.6`  | 仮定                                 | 角度不足の先端ヒット時に残す水平速度の割合                                                                                       |
| `COMPRESSION_HORIZONTAL_DAMP`      | `0.75` | 仮定                                 | 先端圧縮中に残す水平速度の割合                                                                                                   |
| `GROUND_CONTACT_BASE_MS`           | `90`   | 仮定                                 | 先端接地（圧縮）時間の基本値（ms）                                                                                               |
| `GROUND_CONTACT_FALL_MS_PER_SPEED` | `12`   | 仮定（定性のみ出典 4）               | 衝突速度あたりに追加する接地時間（ms）                                                                                           |
| `GRAVITY_Y`                        | `1.6`  | 仮定                                 | Matter.js の重力 Y（DOM と同じく下向き正）                                                                                       |
| `PLAYER_WIDTH`                     | `18`   | 仮定                                 | プレイヤー胴体の当たり判定幅（px）                                                                                               |
| `PLAYER_HEIGHT`                    | `44`   | 仮定                                 | プレイヤー胴体の当たり判定高さ（px）                                                                                             |
| `STICK_LENGTH`                     | `36`   | 仮定                                 | ポゴ軸の長さ（px）                                                                                                               |
| `TIP_RADIUS`                       | `5`    | 仮定                                 | ポゴ先端円の半径（px）                                                                                                           |
| `PATH_SAMPLE_SPACING`              | `8`    | 仮定                                 | SVG `<path>` サンプリング間隔（px）                                                                                              |
| `KILL_PLANE_MARGIN`                | `80`   | 仮定                                 | ステージ境界から外れた際にリスポーンする余白（px）                                                                               |
| `CAMERA_PAN_SPEED`                 | `420`  | 仮定（矢印キーでの移動自体は出典 8） | `W` / `S` および矢印キーでカメラを先読みする速度（px/秒）                                                                        |
| `CAMERA_PAN_LIMIT`                 | `320`  | 仮定                                 | カメラ先読みオフセットの上限（px）                                                                                               |
| `W_S_CAMERA_PAN`                   | `true` | 仮定                                 | 本家に `W` / `S` 移動の出典がないため、WASD 操作の要求に対して `W`（上見渡し）/ `S`（下見渡し）を割り当てます                    |

## 4. 純粋関数の仕様

物理エンジンや DOM に依存しない純粋関数として、以下を実装し単体テストで挙動を検証します。

- **`src/lib/pogo/boost.ts`**:
  - `createBoostState()`: 累積角 `0`、未成立の初期状態を返します。
  - `accumulateAirborneRotation(state, deltaDeg, thresholdDeg)`: 空中の回転増分を符号付きで累積し、`Math.abs(accumulatedDeg) >= thresholdDeg` でブースト成立（`ready: true`）にします。一度成立した後の微調整の逆回転や `720°` 以上の追加回転では状態を増強しません。
  - `cancelBoost()`: 累積角と成立フラグを初期化します。
  - `handleContactBoost(state, { isTipContact, jumpHeld })`: 先端以外の接地、または接地チャージ中に `jumpHeld` が `false` になった場合は `cancelBoost()` で取り消します。
  - `consumeBoostOnLaunch(state, jumpHeld)`: 跳躍時に `state.ready && jumpHeld` であれば `boosted: true` を返し、状態を初期化します。
- **`src/lib/pogo/impulse.ts`**:
  - `classifyLanding(contactPart, alignmentAngleDeg)`: 胴体接地は `"ouch"`、先端接地で `|alignmentAngleDeg| <= TIP_ALIGN_MAX_ANGLE_DEG` なら `"clean"`、超過なら `"glancing"` を返します。
  - `computeContactDurationMs(impactSpeed)`: `GROUND_CONTACT_BASE_MS + Math.max(0, impactSpeed) * GROUND_CONTACT_FALL_MS_PER_SPEED` を返します。
  - `computeBounce(input)`: `"ouch"` / `"glancing"` は `OUCH_BOUNCE_SCALE` の減衰反発と接地時間 `0`・ブースト無効を返します。`"clean"` は `usedBoost = jumpHeld && boostReady` に応じて基本速度（`AUTO_BOUNCE_SPEED` / `CHARGED_BOUNCE_SPEED` / `CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER`）に `impactSpeed * FALL_SPEED_BOUNCE_SCALE` を加え、`MAX_BOUNCE_SPEED` でクランプして返します。

## 5. PoC アーキテクチャ

- **物理と描画の分離**: 衝突判定と時間積分は `matter-js` + `poly-decomp`（`src/lib/pogo/simulate.ts` および同モジュールのみが参照する `src/lib/pogo/simulate-bodies.ts`）に限定し、描画は DOM + SVG のみに分離します。
- **遅延ロードの境界**: `matter-js` と `poly-decomp` をトップレベルで import するのは `src/lib/pogo/simulate.ts` と `src/lib/pogo/simulate-bodies.ts` のみとします。`src/routes/pogo/+page.svelte` は `onMount` 内で `import("../../lib/pogo/simulate")` を動的に呼び出し、他ルート・レイアウト・SSR バンドルへ物理エンジンを含めません。
- **SVG 地形の物理化（`src/lib/pogo/svg-terrain.ts`）**: 閉じた（または端点接続で閉路化した）`<path data-terrain>` 要素を `getTotalLength()` と `getPointAtLength()` で `PATH_SAMPLE_SPACING` 間隔で点列化し、`path.getScreenCTM()` と `#world` 要素の矩形から変換行列を作って `#world` 座標系へ変換します。`simulate-bodies.ts` 側で `Common.setDecomp(decomp)` を設定した上で `Bodies.fromVertices` により静的剛体を生成し、バウンディングボックスを元の頂点群へ位置合わせします。
- **単一 `div` と `#world` カメラ**: プレイヤーは `#world` 内の単一 `<div>` として描画し、毎フレーム `transform: translate3d(...) rotate(...)` のみを更新します（`top` / `left` による座標指定は行いません）。カメラは `#world` へ逆向きの `translate3d(...)` を適用してプレイヤー位置とパンオフセットを追従させます。
- **入力・ステージ・リスポーン**:
  - `A` / `D`: 左右回転（圧縮中も次の跳躍角の狙い合わせが可能、仮定）。
  - `Space`: チャージ・跳躍（`keydown` / `keyup` で `preventDefault()` し、ページスクロールを防止）。
  - `W` / `S` および矢印キー: カメラパン（`W` / `S` 割り当ては `W_S_CAMERA_PAN` による仮定）。
  - `R`: スタート地点への手動リスポーン（PoC の UI 補助。Pogostuck の仕様ではなく、仮定のゲームルールでもありません）。
  - ステージはスタート台、通常／チャージで登れる段差、ギャップ、斜面、および `285°` ブーストジャンプで到達できる高台ゴールで構成し、ステージ境界から `KILL_PLANE_MARGIN` を超えて落下した場合はスタート地点へ自動リスポーンします。

## 6. スコープ外

- エモート（`E` キー）およびスケートモード
- 連続ブーストによるジャンプ力の段階的増加（出典 13 は未確認のため不採用）
- グローバルナビゲーションおよび `/sitemap.xml` への `/pogo` 登録
