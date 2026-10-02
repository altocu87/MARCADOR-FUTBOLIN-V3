import { useEffect, useRef } from 'react'

export function CancelMatchDialog({ recovering, error, onKeep, onDiscard }: {
  recovering: boolean; error: string; onKeep: () => void; onDiscard: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  return <dialog ref={dialog} className="cancel-match-dialog" aria-labelledby="cancel-match-title" aria-describedby="cancel-match-description" onCancel={event => { event.preventDefault(); onKeep() }}>
    <p className="eyebrow">{recovering ? 'COPIA LOCAL' : 'PARTIDO EN CURSO'}</p>
    <h2 id="cancel-match-title">{recovering ? '¿Descartar este partido?' : 'Hay un partido en curso. ¿Deseas cancelarlo?'}</h2>
    <p id="cancel-match-description">Se perderá únicamente este partido sin terminar. Los resultados guardados y los pendientes de sincronización se conservan.</p>
    {error && <p role="alert" className="cancel-match-error">{error}</p>}
    <div className="cancel-match-actions">
      <button type="button" className="primary-action" autoFocus onClick={onKeep}>{recovering ? 'NO, CONSERVAR PARTIDO' : 'NO, CONTINUAR PARTIDO'}</button>
      <button type="button" className="discard-match-action" onClick={onDiscard}>{recovering ? 'SÍ, DESCARTAR PARTIDO' : 'SÍ, CANCELAR PARTIDO'}</button>
    </div>
  </dialog>
}
