import assert from "node:assert/strict";
import test from "node:test";
import { broadcastDate, celebrations, commendations, nextStage, pick, programmeNumber, stageProps } from "../src/broadcast.ts";

test("祝う対象、称賛文、小道具に作者の無駄がある", () => {
  assert.ok(celebrations.length >= 36);
  assert.ok(commendations.length >= 72);
  assert.ok(stageProps.length >= 24);
});

test("番組は循環し、終演後には視聴記念票を出す", () => {
  assert.equal(pick(celebrations, celebrations.length + 1), celebrations[1]);
  assert.equal(programmeNumber(7), "第0007回");
  assert.equal(nextStage("ceremony"), "ticket");
  assert.equal(nextStage("ticket"), "ticket");
  assert.match(broadcastDate(new Date("2026-10-13T00:00:00+09:00")), /2026年10月13日/);
});
