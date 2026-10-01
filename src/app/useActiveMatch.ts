import { useEffect, useState, type RefObject } from 'react'
import type { MatchEngine } from '../match-engine/MatchEngine'
import type { Player } from '../services/persistence/models'
import type { SaveCoordinator } from '../services/persistence/SaveCoordinator'
import type { ActiveMatchStore } from '../services/persistence/ActiveMatchStore'

export interface RunContext {
  id: string
  ownerId: string | null
  players: Player[]
  testMode: boolean
  coordinator: SaveCoordinator | null
  activeStore: ActiveMatchStore | null
  checkpointReleased: boolean
}

/** Synchronous write on accepted actions; at most once per clock second. */
export function useActiveMatch(engine: MatchEngine, run: RefObject<RunContext | null>) {
  const [warning, setWarning] = useState('')
  useEffect(() => {
    let previousSignature = ''
    const save = (force = false) => {
      const context = run.current
      if (!context || context.testMode || !context.activeStore || !context.ownerId || context.checkpointReleased) return
      const state = engine.getState()
      if (state.status === 'IDLE') return
      const signature = [context.id, state.status, state.period, state.events.length, state.elapsedSeconds].join(':')
      if (!force && signature === previousSignature) return
      try {
        context.activeStore.save({ version: 1, id: context.id, ownerId: context.ownerId, testMode: false,
          players: context.players, checkpoint: engine.getCheckpoint() })
        previousSignature = signature
        setWarning('')
      } catch { setWarning('RECUPERACIÓN LOCAL NO DISPONIBLE · No cierres ni recargues.') }
    }
    const stop = engine.subscribe(() => save())
    const onHide = () => { engine.tick(); save(true) }
    const onVisibility = () => { if (document.visibilityState === 'hidden') onHide() }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop(); window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [engine, run])
  return run.current && !run.current.testMode && !run.current.checkpointReleased ? warning : ''
}
