import assert from "node:assert/strict";
import { formatFullDateTime, formatMediumDate, formatMediumDateTime } from "../src/lib/format.ts";

const winter = new Date("2026-01-15T17:30:00.000Z");
const summer = new Date("2026-07-15T16:30:00.000Z");

assert.equal(formatMediumDate(winter), "15 jan. 2026");
assert.equal(formatMediumDateTime(winter), "15 jan. 2026 18:30");
assert.equal(formatFullDateTime(winter), "torsdag 15 januari 2026 kl. 18:30");
assert.equal(formatMediumDateTime(summer), "15 juli 2026 18:30");

console.log("format: alla kontroller gick igenom");
