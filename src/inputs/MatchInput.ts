import type { MatchEvent } from '../match-engine/types'

/** Contrato común para entradas de pantalla, ratón y futuros pulsadores ESP32. */
export interface MatchInput {
  emit(event: MatchEvent): void
}
