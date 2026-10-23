import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initDatabase, closeDatabase } from "../Tools/DatabaseTool.js";
import { RequestsResource } from "./RequestsResource.js";
import { SessionsResource } from "./SessionsResource.js";

const db = initDatabase(":memory:");
db.exec(readFileSync(new URL("../../database/migrations/001_initial_schema.sql", import.meta.url), "utf8"));
after(closeDatabase);

test("captured requests retain millisecond precision in SQLite", async () => {
  const session = SessionsResource.createSession({ name: "Precision Test" });
  const before = Date.now();
  const request = await RequestsResource.recordRequest(session, {
    method: "POST",
    path: "/w/precision-test",
  });
  const after = Date.now();

  assert.match(request.created_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
  const recordedAt = Date.parse(`${request.created_at.replace(" ", "T")}Z`);
  assert.ok(recordedAt >= before - 5 && recordedAt <= after + 5);
  assert.equal(RequestsResource.listRequests(session.id)[0].created_at, request.created_at);
});
