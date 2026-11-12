import { expect, test } from "vite-plus/test";
import { siteIdentity } from "./constants";
import { createHomeJsonLd } from "./json-ld";

test("home JSON-LD reuses the site meta description on Person and WebSite", () => {
  const graphs = createHomeJsonLd();
  const person = graphs.find((graph) => graph["@type"] === "Person");
  const website = graphs.find((graph) => graph["@type"] === "WebSite");
  expect(person?.description).toBe(siteIdentity.description);
  expect(website?.description).toBe(siteIdentity.description);
});
