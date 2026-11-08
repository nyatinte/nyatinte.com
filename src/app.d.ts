// See https://svelte.dev/docs/kit/types#app.d.ts for information about these interfaces.
export {};

declare global {
  namespace Cloudflare {
    interface Env {
      ACCESS_AUDIENCE?: string;
      ACCESS_TEAM_DOMAIN?: string;
      ACHIEVEMENT_GITHUB_TOKEN?: string;
    }
  }

  namespace App {
    interface Error {
      code?: "GONE" | "NOT_FOUND";
    }

    interface Platform {
      env: Cloudflare.Env;
    }
  }
}
