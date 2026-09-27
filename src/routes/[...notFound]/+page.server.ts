import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => {
  error(404, "ページが見つかりません。", { code: "NOT_FOUND" });
};
