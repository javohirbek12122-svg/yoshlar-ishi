export const POINTS = Object.freeze({ win: 3, draw: 1, loss: 0 });
export const TEAM_COUNT = 4;
export const MAX_COUNTER = 999;

export function clampInt(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(MAX_COUNTER, Math.max(0, Math.trunc(number)));
}

export function pointsFor(team) {
  return clampInt(team?.wins) * POINTS.win + clampInt(team?.draws) * POINTS.draw;
}

export function gamesPlayed(team) {
  return clampInt(team?.wins) + clampInt(team?.draws) + clampInt(team?.losses);
}

/**
 * Competition ranking: equal points share a rank (1, 1, 3).
 * Tie order is stable and follows the entered sort_order.
 */
export function rankTeams(teams) {
  const sorted = [...teams].sort((a, b) =>
    pointsFor(b) - pointsFor(a) ||
    (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
  );
  let previousPoints = null;
  let rank = 0;
  return sorted.map((team, index) => {
    const score = pointsFor(team);
    if (previousPoints === null || score !== previousPoints) rank = index + 1;
    previousPoints = score;
    return { ...team, points: score, played: gamesPlayed(team), rank };
  });
}

export function validateTeams(teams) {
  const errors = [];
  if (!Array.isArray(teams) || teams.length !== TEAM_COUNT) {
    return { valid: false, errors: ['Turnirda aynan 4 ta jamoa bo‘lishi kerak.'] };
  }
  const names = teams.map((team) => String(team?.name ?? '').trim().toLocaleLowerCase('uz'));
  if (names.some((name) => !name)) errors.push('Har bir jamoa nomi kiritilishi shart.');
  if (new Set(names.filter(Boolean)).size !== names.filter(Boolean).length) {
    errors.push('Jamoa nomlari takrorlanmasligi kerak.');
  }
  for (const [index, team] of teams.entries()) {
    for (const field of ['wins', 'draws', 'losses']) {
      const numeric = Number(team?.[field]);
      if (!Number.isInteger(numeric) || numeric < 0 || numeric > MAX_COUNTER) {
        errors.push((index + 1) + '-jamoa: ' + field + ' qiymati 0–' + MAX_COUNTER + ' oralig‘idagi butun son bo‘lishi kerak.');
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
