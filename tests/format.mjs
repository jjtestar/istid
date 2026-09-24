import assert from "node:assert/strict";

// Formatterarna i format.ts pinnar Europe/Stockholm explicit. Kör testet med
// olika externa TZ-värden för att verifiera att processens tidszon inte påverkar
// de svenska förväntningarna.
const { formatFullDateTime, formatMediumDate, formatMediumDateTime } = await import("../src/lib/format.ts");

const winter = new Date("2026-01-15T17:30:00.000Z");
const summer = new Date("2026-07-15T16:30:00.000Z");
const dstForward = new Date("2026-03-29T01:30:00.000Z");
const dstBack = new Date("2026-10-25T00:30:00.000Z");
const newYearEve = new Date("2026-12-31T23:30:00.000Z");

assert.equal(formatMediumDate(winter), "15 jan. 2026");
assert.equal(formatMediumDateTime(winter), "15 jan. 2026 18:30");
assert.equal(formatFullDateTime(winter), "torsdag 15 januari 2026 kl. 18:30");

assert.equal(formatMediumDate(summer), "15 juli 2026");
assert.equal(formatMediumDateTime(summer), "15 juli 2026 18:30");
assert.equal(formatFullDateTime(summer), "onsdag 15 juli 2026 kl. 18:30");

assert.equal(formatMediumDateTime(dstForward), "29 mars 2026 03:30");
assert.equal(formatMediumDateTime(dstBack), "25 okt. 2026 02:30");

assert.equal(formatMediumDate(newYearEve), "1 jan. 2027");
assert.equal(formatMediumDateTime(newYearEve), "1 jan. 2027 00:30");
assert.equal(formatFullDateTime(newYearEve), "fredag 1 januari 2027 kl. 00:30");

console.log("format: alla kontroller gick igenom");
