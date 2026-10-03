import { bindings, defineConfig } from "cf/config";

// `cf` has no `keep_vars` equivalent. Production deploy remains on the Varlock
// Wrangler bridge until it can preserve the existing variable-management flow.
export default defineConfig({
  accountId: "b18ddc251d51425f2abc6f750618896e",
  worker: {
    compatibilityDate: "2026-09-19",
    compatibilityFlags: ["nodejs_compat", "nodejs_als"],
    domains: ["nyatinte.com"],
    entrypoint: ".svelte-kit/cloudflare/_worker.js",
    env: {
      ASSETS: bindings.assets(),
    },
    name: "nyatinte-com",
    observability: {
      enabled: true,
      logs: {
        enabled: true,
        headSamplingRate: 1,
      },
      traces: {
        enabled: true,
        headSamplingRate: 0.01,
      },
    },
    previewUrls: false,
    workersDev: false,
  },
});
