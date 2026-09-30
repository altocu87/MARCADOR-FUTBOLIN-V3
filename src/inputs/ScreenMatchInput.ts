import type { MatchEngine } from '../match-engine/MatchEngine'
import type { MatchEvent } from '../match-engine/types'
import type { MatchInput } from './MatchInput'

/** Adaptador para controles táctiles y de ratón del simulador web. */
export class ScreenMatchInput implements MatchInput {
  constructor(private readonly engine: MatchEngine) {}

  emit(event: MatchEvent): void {
    this.engine.dispatch(event)
  }
}
