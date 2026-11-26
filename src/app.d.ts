export {};

declare global {
  const __PREVIEW_EDIT__: boolean;
  const __PREVIEW_PR__: string;
  const __PREVIEW_SHA__: string;

  namespace Cloudflare {
    interface Env {
      ACCESS_AUDIENCE?: string;
      ACCESS_TEAM_DOMAIN?: string;
    }
  }

  namespace App {
    interface Error {
      code?: "NOT_FOUND";
    }

    interface Platform {
      env: Cloudflare.Env;
    }
  }
}
