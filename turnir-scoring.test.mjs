import test from 'node:test';
import assert from 'node:assert/strict';
import { clampInt, pointsFor, gamesPlayed, rankTeams, validateTeams } from './turnir-scoring.mjs';

const teams = () => [
  { id:'a',name:'Paxtakor',wins:2,draws:1,losses:0,sort_order:1 },
  { id:'b',name:'Nasaf',wins:2,draws:0,losses:1,sort_order:2 },
  { id:'c',name:'Neftchi',wins:1,draws:1,losses:1,sort_order:3 },
  { id:'d',name:'Bunyodkor',wins:0,draws:1,losses:2,sort_order:4 }
];

test('required example: two wins and one draw equal seven points', () => {
  assert.equal(pointsFor({ wins:2, draws:1, losses:0 }), 7);
});

test('losses award zero points', () => {
  assert.equal(pointsFor({ wins:0, draws:0, losses:8 }), 0);
});

test('points use win=3 and draw=1', () => {
  assert.equal(pointsFor({ wins:3, draws:2, losses:1 }), 11);
});

test('played count is the sum of W/D/L', () => {
  assert.equal(gamesPlayed({ wins:2, draws:1, losses:4 }), 7);
});

test('standings sort by points descending', () => {
  const result = rankTeams(teams());
  assert.deepEqual(result.map((item) => item.name), ['Paxtakor','Nasaf','Neftchi','Bunyodkor']);
  assert.deepEqual(result.map((item) => item.points), [7,6,4,1]);
});

test('equal points receive the same competition rank', () => {
  const result = rankTeams([
    {name:'A',wins:2,draws:1,losses:0,sort_order:1},
    {name:'B',wins:2,draws:1,losses:0,sort_order:2},
    {name:'C',wins:1,draws:1,losses:0,sort_order:3},
    {name:'D',wins:0,draws:0,losses:1,sort_order:4}
  ]);
  assert.deepEqual(result.map((item) => item.rank), [1,1,3,4]);
});

test('tie display order remains stable', () => {
  const result = rankTeams([
    {name:'B',wins:1,draws:0,losses:0,sort_order:2},
    {name:'A',wins:1,draws:0,losses:0,sort_order:1}
  ]);
  assert.deepEqual(result.map((item) => item.name), ['A','B']);
});

test('negative and invalid counters clamp to zero in display calculation', () => {
  assert.equal(clampInt(-4), 0);
  assert.equal(clampInt(Number.NaN), 0);
});

test('decimal values are truncated for display but rejected by validation', () => {
  assert.equal(clampInt(4.8), 4);
  const result = validateTeams([
    {name:'A',wins:1.5,draws:0,losses:0},
    {name:'B',wins:0,draws:0,losses:0},
    {name:'C',wins:0,draws:0,losses:0},
    {name:'D',wins:0,draws:0,losses:0}
  ]);
  assert.equal(result.valid, false);
});

test('exactly four teams are required', () => {
  assert.equal(validateTeams(teams()).valid, true);
  assert.equal(validateTeams(teams().slice(0,3)).valid, false);
});

test('duplicate and empty team names are rejected', () => {
  const data = teams();
  data[1].name = data[0].name;
  assert.equal(validateTeams(data).valid, false);
  data[1].name = '';
  assert.equal(validateTeams(data).valid, false);
});

test('counter upper bound is enforced', () => {
  const data = teams();
  data[0].wins = 1000;
  assert.equal(validateTeams(data).valid, false);
});

test('a zero-points team remains in the standings', () => {
  const result = rankTeams(teams());
  assert.equal(result.length, 4);
  assert.equal(result[3].points, 1);
});

test('validation accepts four unique valid teams', () => {
  assert.deepEqual(validateTeams(teams()), { valid:true, errors:[] });
});
