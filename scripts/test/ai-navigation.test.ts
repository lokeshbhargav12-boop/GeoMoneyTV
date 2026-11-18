import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  extractSearchTerm,
  getToolRecommendations,
  isExploratoryQuery,
} from "@/lib/ai-navigation";
import { POST as navigate } from "@/app/api/ai/navigate/route";

function paths(prompt: string): string[] {
  return getToolRecommendations(prompt).map((recommendation) => recommendation.path);
}

async function postPrompt(prompt: string) {
  const response = await navigate(new Request("http://localhost/api/ai/navigate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  }));
  return { status: response.status, body: await response.json() };
}

describe("AI navigation recommendations", () => {
  it("offers gold tools instead of forcing a news redirect", async () => {
    assert.equal(isExploratoryQuery("gold"), true);
    const goldPaths = paths("gold");
    assert.ok(goldPaths.includes("/news?search=gold"));
    assert.ok(goldPaths.includes("/tools#equivalent-grade"));
    assert.ok(goldPaths.includes("/tools#price-alerts"));
    assert.ok(goldPaths.includes("/tools#resource-estimation"));
    assert.equal(new Set(goldPaths).size, goldPaths.length);

    const { status, body } = await postPrompt("gold");
    assert.equal(status, 200);
    assert.equal(body.path, null);
    assert.equal(body.query, "gold");
    assert.ok(body.recommendations.length >= 4);
  });

  it("matches other commodity and energy topics to their specialist desks", () => {
    assert.ok(paths("oil").includes("/energy/oil-and-gas"));
    assert.ok(paths("coal").includes("/energy/coal#benchmarks"));
    assert.ok(paths("solar").includes("/energy#calculators"));
  });

  it("links material queries to detailed material intelligence", () => {
    const lithiumPaths = paths("lithium");
    assert.ok(lithiumPaths.includes("/materials/Li"));
    assert.ok(lithiumPaths.includes("/materials"));
  });

  it("provides useful fallbacks for any unfamiliar topic", () => {
    const nvidiaPaths = paths("What is happening with Nvidia?");
    assert.ok(nvidiaPaths.includes("/news?search=nvidia"));
    assert.ok(nvidiaPaths.includes("/world-monitor"));
    assert.ok(nvidiaPaths.includes("/tools"));
    assert.equal(extractSearchTerm("What is happening with Nvidia?"), "nvidia");
  });

  it("uses whole-word matching instead of confusing soil with oil", () => {
    assert.equal(paths("soil").includes("/energy/oil-and-gas"), false);
  });

  it("preserves explicit navigation commands", async () => {
    assert.equal(isExploratoryQuery("Open the Energy Hub"), false);
    assert.equal(isExploratoryQuery("Show me news about China"), false);
    assert.equal(isExploratoryQuery("Latest intelligence on gold"), true);

    const energy = await postPrompt("Open the Energy Hub");
    assert.equal(energy.body.path, "/energy");
    assert.equal(energy.body.recommendations, undefined);

    const news = await postPrompt("Show me news about China");
    assert.equal(news.body.path, "/news?search=china");

    const settings = await postPrompt("Open settings");
    assert.equal(settings.body.path, "/admin/settings");
  });

  it("continues to reject empty requests", async () => {
    const { status, body } = await postPrompt("   ");
    assert.equal(status, 400);
    assert.match(body.error, /enter a navigation request/i);
  });
});
