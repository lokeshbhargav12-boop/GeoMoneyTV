import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  cleanText,
  newestTimestamp,
  normalizeEvidenceEvents,
  normalizeHttpUrl,
  normalizeSourceStatus,
  parseBounds,
  pointIsInBounds,
} from "@/lib/aperture-analysis";
import { POST as analyzeBounds } from "@/app/api/analyze-bbox/route";
import { POST as analyzeBrief } from "@/app/api/world-monitor/ai-brief/route";

describe("Aperture analysis contracts", () => {
  it("accepts valid bounds and rejects malformed or wrapping bounds", () => {
    assert.deepEqual(parseBounds({ north: 20, south: 10, east: 40, west: 30 }), {
      north: 20,
      south: 10,
      east: 40,
      west: 30,
    });
    assert.equal(parseBounds({ north: 10, south: 20, east: 40, west: 30 }), null);
    assert.equal(parseBounds({ north: 20, south: 10, east: -170, west: 170 }), null);
    assert.equal(parseBounds({ north: 91, south: 10, east: 40, west: 30 }), null);
  });

  it("checks whether observations are inside selected bounds", () => {
    const bounds = parseBounds({ north: 20, south: 10, east: 40, west: 30 });
    assert.ok(bounds);
    assert.equal(pointIsInBounds(15, 35, bounds), true);
    assert.equal(pointIsInBounds(25, 35, bounds), false);
    assert.equal(pointIsInBounds("bad", 35, bounds), false);
  });

  it("normalizes source mode and observation time without inventing freshness", () => {
    assert.deepEqual(
      normalizeSourceStatus(
        { mode: "stale", source: " OpenSky ", observedAt: "2026-03-10T12:00:00Z" },
        "fallback",
      ),
      {
        mode: "stale",
        source: "OpenSky",
        observedAt: "2026-03-10T12:00:00.000Z",
        notice: undefined,
      },
    );
    assert.equal(normalizeSourceStatus({ mode: "made-up" }, "fallback").mode, "unavailable");
    assert.equal(normalizeSourceStatus({}, "fallback").observedAt, null);
  });

  it("sanitizes structured evidence and clamps threat scores", () => {
    const events = normalizeEvidenceEvents([
      {
        id: " event-1 ",
        title: "  Port disruption   reported ",
        description: " Reported by provider ",
        source: "rss",
        sourceDetail: "Reuters",
        timestamp: "2026-03-10T10:00:00Z",
        region: "Europe",
        category: "trade",
        url: "https://example.com/story",
        threatScore: 150,
      },
      { description: "missing title" },
    ]);

    assert.equal(events.length, 1);
    assert.equal(events[0].title, "Port disruption reported");
    assert.equal(events[0].threatScore, 100);
    assert.equal(events[0].timestamp, "2026-03-10T10:00:00.000Z");
    assert.equal(events[0].url, "https://example.com/story");
  });

  it("permits only HTTP(S) and internal evidence links", () => {
    assert.equal(normalizeHttpUrl("javascript:alert(1)"), "");
    assert.equal(normalizeHttpUrl("/news/example"), "/news/example");
    assert.equal(normalizeHttpUrl("https://example.com/a"), "https://example.com/a");
  });

  it("uses the newest real timestamp and safely cleans text", () => {
    assert.equal(
      newestTimestamp(["2026-03-10T10:00:00Z", "2026-03-10T12:00:00Z", "invalid"]),
      "2026-03-10T12:00:00.000Z",
    );
    assert.equal(cleanText("  multiple\n spaces  "), "multiple spaces");
  });

  it("rejects malformed region analyzer requests before calling AI", async () => {
    const response = await analyzeBounds(new Request("http://localhost/api/analyze-bbox", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bounds: { north: 1, south: 2, east: 3, west: 4 } }),
    }));
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /bounding box/i);
  });

  it("does not generate a briefing without current sourced evidence", async () => {
    const response = await analyzeBrief(new Request("http://localhost/api/world-monitor/ai-brief", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: [], assetContext: {}, sourceStatus: {} }),
    }));
    assert.equal(response.status, 422);
    assert.match((await response.json()).error, /no current sourced evidence/i);
  });
});