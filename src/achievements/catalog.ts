export type AchievementMetric = 'played' | 'wins' | 'streak' | 'ranked_played' | 'ranked_wins' | 'team_goals' | 'clean_win' | 'extra_win' | 'penalty_win'
export interface AchievementFamily {
  readonly id: AchievementMetric
  readonly title: string
  readonly description: string
  readonly thresholds: readonly number[]
}

// Family and ordinal identify a tier; changing a threshold/version cannot create
// a second award. XP V2 is expressly approved; production awards are derived by the server.
export const ACHIEVEMENT_CATALOG_VERSION = 'tiers-v2'
export const achievementCatalog: readonly AchievementFamily[] = Object.freeze([
  { id: 'played', title: 'Juega partidos', description: 'Completa partidos en cualquier modo.', thresholds: [1, 5, 25, 100, 250] },
  { id: 'wins', title: 'Gana partidos', description: 'Victorias en cualquier modo, incluidas las tandas.', thresholds: [1, 5, 25, 100, 250] },
  { id: 'team_goals', title: 'Goles de tu equipo', description: 'Goles de tu equipo en tus partidos, compartidos por los compañeros. Los penaltis no suman goles.', thresholds: [1, 5, 50, 250, 1000] },
  { id: 'streak', title: 'Encadena victorias', description: 'Tu mejor racha. Un empate o una derrota la interrumpe.', thresholds: [2, 3, 5, 10, 20] },
  { id: 'ranked_played', title: 'Juega Clasificatorio', description: 'Completa partidos Clasificatorios 1v1 o 2v2.', thresholds: [1, 5, 25, 50, 100] },
  { id: 'ranked_wins', title: 'Gana en Clasificatorio', description: 'Victorias en partidos Clasificatorios 1v1 o 2v2.', thresholds: [1, 5, 10, 25, 50] },
  { id: 'clean_win', title: 'Gana sin encajar', description: 'Victorias con al menos un gol de campo y ninguno recibido. Una tanda tras 0–0 no cuenta.', thresholds: [1, 5, 10, 25, 50] },
  { id: 'extra_win', title: 'Resuelve en prórroga', description: 'Victorias con prórroga confirmada y sin tanda.', thresholds: [1, 3, 5, 10, 25] },
  { id: 'penalty_win', title: 'Gana en penaltis', description: 'Victorias decididas por una tanda confirmada.', thresholds: [1, 3, 5, 10, 25] },
].map(family => Object.freeze({ ...family, thresholds: Object.freeze(family.thresholds) })) as AchievementFamily[])
