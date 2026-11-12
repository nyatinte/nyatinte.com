---
title: わからなかったことを調べて書く
description: ログの記事は、調べて分かったことを Markdown か MDX にして src/content/log に置く。
date: 2026-11-12
---

このファイルは公開している記事であり、次の記事の雛形でもある。コピーして、ファイル名をスラッグに変える。ファイル名が `/log/<slug>` になる。

`title`、`description`、`date` は必須。`updated` と `image` は任意。日付は `YYYY-MM-DD`。`image` には OGP 画像のパスか URL を書く。空なら共通の画像を使う。

本文には、調べる前に分からなかったことと、調べて分かったことを書く。`.svx` なら Svelte のコンポーネントも置ける。
