import type { ProgressionRepository } from '../services/persistence/ProgressionRepository'
import type { CompetitionRepository } from '../services/persistence/CompetitionRepository'
import { SupabaseCompetitionRepository } from '../services/supabase/competition'
import type { AuthService } from '../services/AuthService'
import type { MatchRepository } from '../services/persistence/MatchRepository'
import type { PlayerRepository } from '../services/persistence/PlayerRepository'
import { supabase } from '../services/supabase/client'
import { SupabaseAuthService } from '../services/supabase/auth'
import { SupabaseMatchRepository, SupabasePlayerRepository, SupabaseProgressionRepository } from '../services/supabase/repositories'

export interface ApplicationServices {
  auth: AuthService
  players: PlayerRepository
  matches: MatchRepository
  progression?: ProgressionRepository
  competition?: CompetitionRepository
  namespace: string
}
export const services: ApplicationServices | null = supabase ? {
  auth: new SupabaseAuthService(supabase),
  players: new SupabasePlayerRepository(supabase),
  matches: new SupabaseMatchRepository(supabase),
  progression: new SupabaseProgressionRepository(supabase),
  competition: new SupabaseCompetitionRepository(supabase),
  namespace: new URL(import.meta.env.VITE_SUPABASE_URL as string).hostname,
} : null
