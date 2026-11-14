<script lang="ts">
  let adultTaps = $state(0);
  let chickTaps = $state(0);
  let message = $state("");
</script>

<div class="landscape">
  <div class="stage">
    <div aria-hidden="true" class="aurora"></div>
    <div aria-hidden="true" class="sky">
      <div class="orbit">
        <svg aria-hidden="true" class="sun" viewBox="0 0 64 64">
          <circle cx="32" cy="32" fill="var(--home-sun)" r="17" />
          <path
            d="M32 3v8 M32 53v8 M3 32h8 M53 32h8 M11.5 11.5l5.7 5.7 M46.8 46.8l5.7 5.7 M52.5 11.5l-5.7 5.7 M17.2 46.8l-5.7 5.7"
            fill="none"
            stroke="var(--home-sun)"
            stroke-linecap="round"
            stroke-width="3"
          />
        </svg>
        <span class="moon"></span>
      </div>
    </div>
    <svg
      aria-hidden="true"
      class="art clouds cloud-left"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <path
        d="M615 296 C625 285 640 284 652 290 C664 274 686 273 700 287 C713 282 727 286 735 296Z"
      />
    </svg>
    <svg
      aria-hidden="true"
      class="art clouds cloud-right"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <path
        d="M880 251 C891 241 904 240 915 245 C927 231 948 232 960 244 C973 239 987 242 996 251Z"
      />
    </svg>
    <svg
      aria-hidden="true"
      class="art scene-back"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <path
        class="far-ice"
        d="M0 480 L101 452 184 455 256 416 341 421 408 368 507 381 554 349 685 361 770 324 880 333 948 308 1068 320 1168 293 1267 314 1370 302 1440 326 V700 H0Z"
      />
      <path
        class="far-light"
        d="M256 416 L341 421 408 368 507 381 554 349 685 361 640 398 551 393 503 420 413 405 366 438Z M770 324 L880 333 948 308 1068 320 1168 293 1139 354 1028 368 965 348 889 385 825 369Z M1267 314 L1370 302 1440 326 V365 L1374 347 1327 365Z"
      />
    </svg>
    <svg
      aria-hidden="true"
      class="art scene-middle"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <path class="sea" d="M0 532 Q351 497 706 523 T1440 516 V900 H0Z" />
      <path
        class="distant-ice"
        d="M0 555 Q121 538 228 553 L333 546 391 564 341 580 219 582 130 595 0 585Z M1000 542 L1101 525 1178 538 1261 531 1440 549 V582 L1350 584 1294 572 1206 582 1140 569 1080 581Z"
      />
    </svg>
    <svg
      aria-hidden="true"
      class="art scene-front"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <g transform="translate(0 12)">
        {#key adultTaps}
          <image
            height="184"
            href="/images/adult-penguin.png"
            width="150.6"
            x="811.4"
            y="390"
            class:bouncing={adultTaps > 0}
          />
        {/key}
        {#key chickTaps}
          <image
            height="118"
            href="/images/chick-penguin.png"
            width="83.3"
            x="742"
            y="456"
            class:bouncing={chickTaps > 0}
          />
        {/key}
        <path
          class="glacier"
          d="M0 643 L170 590 278 606 430 546 568 568 680 525 777 535 862 550 930 546 1060 580 1190 556 1320 576 1440 603 V900 H0Z"
        />
        <path
          class="ice-depth"
          d="M278 606 L430 546 370 641 319 704 232 720Z M680 525 L777 535 862 550 885 620 815 678 752 647 641 604Z M1190 556 L1320 576 1240 625 1200 685 1137 634Z"
        />
        <path
          class="ice-facet"
          d="M0 643 L170 590 278 606 214 666 92 701 0 684Z M430 546 L568 568 680 525 641 604 532 631 478 602 370 641Z M930 546 L1060 580 1190 556 1137 634 1024 649 977 603 885 620Z M1320 576 L1440 603 V668 L1372 641 1315 661 1240 625Z"
        />
        <path
          class="ice-surface"
          d="M0 827 L191 770 348 793 492 752 633 782 510 900 H0Z M720 900 L899 780 1044 797 1199 759 1440 802 V900Z"
        />
      </g>
    </svg>
    <button
      aria-label="親ペンギンをバウンス"
      class="penguin adult"
      onclick={() => {
    adultTaps += 1;
    message = `親ペンギンを押しました（${adultTaps}回）`;
  }}
      type="button"
    ></button>
    <button
      aria-label="子ペンギンをバウンス"
      class="penguin chick"
      onclick={() => {
    chickTaps += 1;
    message = `子ペンギンを押しました（${chickTaps}回）`;
  }}
      type="button"
    ></button>
  </div>
  <span aria-live="polite" class="sr-only">{message}</span>
</div>

<style>
  @layer components {
    @scope (.landscape) {
      :scope {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }
      .stage {
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: 50%;
        inline-size: max(100%, 160svh, 51.2rem);
        block-size: max(100%, 62.5vw);
        background: var(--home-sky);
        transform: translate(-50%, -50%);
        transition: background-color var(--home-theme-duration)
          var(--home-theme-easing);
      }
      .art {
        position: absolute;
        inset: 0;
        display: block;
        inline-size: 100%;
        block-size: 100%;
      }
      .aurora {
        --veil-base: var(--home-aurora-base);
        --veil-folds: linear-gradient(
          105deg,
          var(--veil-base) 0% 3%,
          transparent 5% 6%,
          var(--veil-base) 11%,
          transparent 14% 18%,
          var(--veil-base) 20% 27%,
          transparent 30% 31%,
          var(--veil-base) 33%,
          transparent 39% 43%,
          var(--veil-base) 49%,
          transparent 54% 57%,
          var(--veil-base) 61% 64%,
          transparent 70% 75%,
          var(--veil-base) 80% 86%,
          transparent 90% 92%,
          var(--veil-base) 97%
        );
        --ice-light: repeating-linear-gradient(
          105deg,
          var(--home-aurora-blue) 0%,
          var(--home-aurora-violet) 19%,
          var(--home-aurora-mint) 33%,
          var(--home-aurora-blue) 48%
        );
        position: absolute;
        inset: 0 0 auto;
        block-size: 60%;
        pointer-events: none;
        background-image: var(--veil-folds), var(--ice-light);
        background-position: 45% 50%;
        background-size: 140%, 100%;
        opacity: var(--aurora-opacity, 0);
        mask-image: radial-gradient(
          ellipse at 65% 0%,
          var(--home-aurora-mask) 30%,
          transparent 75%
        );
        transition: opacity var(--home-theme-duration) var(--home-theme-easing);
      }
      .aurora::after {
        position: absolute;
        inset: 0 -25%;
        content: "";
        background-image: var(--veil-folds), var(--ice-light);
        background-position: 45% 50%;
        background-size: 100%, 90%;
        mix-blend-mode: difference;
      }
      @media (prefers-reduced-motion: no-preference) {
        .aurora::after {
          animation: aurora-drift 24s ease-in-out infinite alternate;
        }
      }
      @keyframes aurora-drift {
        to {
          transform: translateY(-12%);
        }
      }
      .scene-back {
        view-transition-name: scene-back;
      }
      .cloud-left {
        view-transition-name: cloud-left;
      }
      .cloud-right {
        view-transition-name: cloud-right;
      }
      .aurora {
        view-transition-name: scene-aurora;
      }
      .scene-middle {
        view-transition-name: scene-middle;
      }
      .scene-front {
        view-transition-name: scene-front;
      }
      .sky {
        position: absolute;
        inset-block-start: 10%;
        inset-inline-start: 47%;
        inline-size: 60%;
        aspect-ratio: 1;
        overflow: visible;
        pointer-events: none;
        view-transition-name: scene-sky;
      }
      .art path {
        transition:
          fill var(--home-theme-duration) var(--home-theme-easing),
          stroke var(--home-theme-duration) var(--home-theme-easing);
      }
      .clouds {
        fill: var(--home-cloud);
      }
      @media (prefers-reduced-motion: no-preference) {
        .cloud-left path {
          animation: cloud-drift 28s ease-in-out infinite alternate;
        }
        .cloud-right path {
          animation: cloud-drift 36s ease-in-out infinite alternate-reverse;
        }
      }
      @keyframes cloud-drift {
        from {
          transform: translateX(-24px);
        }
        to {
          transform: translateX(24px);
        }
      }
      .far-ice {
        fill: var(--home-far-ice);
      }
      .far-light {
        fill: var(--home-far-ice-light);
      }
      .sea {
        fill: var(--home-sea);
      }
      .distant-ice {
        fill: var(--home-distant-ice);
      }
      .glacier {
        fill: var(--home-glacier);
      }
      .ice-depth {
        fill: var(--home-glacier-depth);
      }
      .ice-facet {
        fill: var(--home-glacier-highlight);
      }
      .ice-surface {
        opacity: 0.3;
        fill: var(--home-glacier-depth);
      }
      .orbit {
        position: absolute;
        inset: 0;
        rotate: var(--orbit-turn, var(--home-initial-orbit, 0deg));
        transition: rotate var(--home-theme-duration) var(--home-theme-easing);
        @starting-style {
          rotate: var(--orbit-turn, var(--home-initial-orbit, 0deg));
        }
      }
      .sun,
      .moon {
        position: absolute;
        inline-size: clamp(3.5rem, 5vw, 5rem);
        aspect-ratio: 1;
        border-radius: 50%;
        translate: -50% -50%;
      }
      .sun {
        inset-block-start: 8%;
        inset-inline-start: 30%;
      }
      .moon {
        inset-block-start: 92%;
        inset-inline-start: 70%;
        box-shadow: inset -0.9rem -0.4rem 0 0 var(--home-moon);
        rotate: calc(-1 * var(--orbit-turn, var(--home-initial-orbit, 0deg)));
        transition: rotate var(--home-theme-duration) var(--home-theme-easing);
        @starting-style {
          rotate: calc(-1 * var(--orbit-turn, var(--home-initial-orbit, 0deg)));
        }
      }
      .penguin {
        position: absolute;
        padding: 0;
        cursor: pointer;
        background: transparent;
        border: 0;
      }
      .adult {
        inset-block-start: 44.33%;
        inset-inline-start: 56%;
        inline-size: 11%;
        block-size: 21%;
      }
      .chick {
        inset-block-start: 51.33%;
        inset-inline-start: 51%;
        inline-size: 6%;
        min-inline-size: 44px;
        block-size: 14%;
      }
      .sr-only {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        white-space: nowrap;
        clip-path: inset(50%);
      }
      .penguin:focus-visible {
        outline: 3px solid var(--home-focus-inner);
        outline-offset: 2px;
        border-radius: 40%;
        box-shadow: 0 0 0 6px var(--home-focus-outer);
      }
      @media (prefers-reduced-motion: no-preference) {
        .bouncing {
          animation: bounce 450ms ease-out;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .orbit,
        .moon,
        .stage,
        .aurora,
        .art path {
          transition: none;
        }
      }
      @keyframes bounce {
        40% {
          transform: translateY(-14px);
        }
        70% {
          transform: translateY(0);
        }
        85% {
          transform: translateY(-4px);
        }
      }
      @media (width <= 700px) {
        .stage {
          transform: translate(-56%, -50%);
        }
      }
      @media (aspect-ratio < 3 / 4) {
        .stage {
          transform: translate(-56%, -50%);
        }
        .adult {
          inset-inline-start: max(56%, calc(56% - 50vw + 10px));
          inset-inline-end: max(33%, calc(44% - 50vw + 10px));
          inline-size: auto;
        }
        .chick {
          inset-inline-start: max(51%, calc(56% - 50vw + 10px));
          inset-inline-end: max(43%, calc(44% - 50vw + 10px));
          inline-size: auto;
        }
      }
    }
  }
</style>
