import { after, test } from "node:test";
import assert from "node:assert/strict";
import { formatTimestamp } from "./dateTime.js";

const previousTimeZone = process.env.TZ;
process.env.TZ = "America/Sao_Paulo";
after(() => {
  if (previousTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = previousTimeZone;
});

test("shows SQLite UTC timestamps in the viewer's local date and time", () => {
  assert.equal(formatTimestamp("2026-10-23 17:04:10.123"), "23/10/2026 14:04:10.123");
  assert.equal(formatTimestamp("2026-10-24 01:15:00.045"), "23/10/2026 22:15:00.045");
});

test("shows zero milliseconds for older second-precision timestamps", () => {
  assert.equal(formatTimestamp("2026-10-23 17:04:10"), "23/10/2026 14:04:10.000");
});

test("accepts ISO timestamps and leaves missing values empty", () => {
  assert.equal(formatTimestamp("2026-10-23T17:04:10.987Z"), "23/10/2026 14:04:10.987");
  assert.equal(formatTimestamp(null), "");
});
