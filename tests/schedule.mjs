import assert from 'node:assert/strict';
import { MAX_SERIES_OCCURRENCES, stockholmDateTime, weeklyOccurrences } from '../src/lib/schedule.ts';

const stockholm = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    dateStyle: 'short',
    timeStyle: 'short',
    hourCycle: 'h23',
});

function ok(result) {
    assert.equal(result.ok, true, result.ok ? '' : result.error);
    return result.occurrences;
}

// Grundschemat: träning tisdag och torsdag.
const trainings = ok(weeklyOccurrences({
    from: '2026-09-21',
    to: '2026-10-04',
    weekdays: [2, 4],
    time: '19:00',
    intervalWeeks: 1,
}));
assert.deepEqual(trainings.map((date) => stockholm.format(date)), [
    '2026-09-22 19:00',
    '2026-09-24 19:00',
    '2026-09-29 19:00',
    '2026-10-01 19:00',
]);

// Matcher på söndagar, varannan vecka räknat från startdatumets vecka.
const matches = ok(weeklyOccurrences({
    from: '2026-09-21',
    to: '2026-10-18',
    weekdays: [7],
    time: '18:00',
    intervalWeeks: 2,
}));
assert.deepEqual(matches.map((date) => stockholm.format(date)), [
    '2026-09-27 18:00',
    '2026-10-11 18:00',
]);

// Sommartidsskiftet (sista söndagen i oktober) får inte flytta klockslaget.
const overDst = ok(weeklyOccurrences({
    from: '2026-10-20',
    to: '2026-11-03',
    weekdays: [2],
    time: '19:00',
    intervalWeeks: 1,
}));
assert.deepEqual(overDst.map((date) => stockholm.format(date)), [
    '2026-10-20 19:00',
    '2026-10-27 19:00',
    '2026-11-03 19:00',
]);
assert.equal(overDst[0].toISOString(), '2026-10-20T17:00:00.000Z');
assert.equal(overDst[2].toISOString(), '2026-11-03T18:00:00.000Z');

// Felaktig indata ska ge ett begripligt fel i stället för tomma serier.
assert.equal(weeklyOccurrences({ from: '2026-09-21', to: '2026-10-04', weekdays: [], time: '19:00', intervalWeeks: 1 }).ok, false);
assert.equal(weeklyOccurrences({ from: '2026-10-04', to: '2026-09-21', weekdays: [2], time: '19:00', intervalWeeks: 1 }).ok, false);
assert.equal(weeklyOccurrences({ from: '2026-09-21', to: '2026-10-04', weekdays: [2], time: 'kl 19', intervalWeeks: 1 }).ok, false);
assert.equal(weeklyOccurrences({ from: '2026-09-22', to: '2026-09-23', weekdays: [7], time: '19:00', intervalWeeks: 1 }).ok, false);

// Perioder som skulle skapa orimligt många tillfällen stoppas.
const tooMany = weeklyOccurrences({ from: '2026-01-01', to: '2029-01-01', weekdays: [1, 2, 3, 4, 5], time: '19:00', intervalWeeks: 1 });
assert.equal(tooMany.ok, false);
assert.match(tooMany.error, new RegExp(String(MAX_SERIES_OCCURRENCES)));

// Enstaka tillfällen tolkas i svensk tid, både sommar- och vintertid.
assert.equal(stockholmDateTime('2026-07-01T19:00').toISOString(), '2026-07-01T17:00:00.000Z');
assert.equal(stockholmDateTime('2026-12-01T19:00').toISOString(), '2026-12-01T18:00:00.000Z');
assert.equal(stockholmDateTime('inte ett datum'), null);

console.log('schedule: alla kontroller gick igenom');
