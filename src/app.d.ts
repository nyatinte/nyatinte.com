// See https://svelte.dev/docs/kit/types#app.d.ts for information about these interfaces.
import type { AnyD1Database } from "drizzle-orm/d1";

declare global {
  namespace App {
    interface Error {
      code?: "GONE" | "NOT_FOUND";
    }

    interface Platform {
      env: {
        ACCESS_AUDIENCE?: string;
        ACCESS_TEAM_DOMAIN?: string;
        DB?: AnyD1Database;
      };
    }
  }
}
