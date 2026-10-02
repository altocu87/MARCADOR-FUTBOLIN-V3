import { APP_VERSION, releases } from '../../app/releases'

export function VersionHistory() {
  return <section className="release-history scroll-panel" aria-label="Historial de versiones" tabIndex={0}>
    <div className="release-intro"><h2>HISTORIAL DE VERSIONES</h2><p>Estás usando la versión <strong>{APP_VERSION}</strong>. Aquí puedes ver qué ha cambiado en cada entrega.</p></div>
    <ol className="release-list">
      {releases.map(release => <li className={`release-card${release.version === APP_VERSION ? ' release-current' : ''}`} key={release.version}>
        <header><h3><span>v{release.version}</span> · {release.title}</h3>{release.version === APP_VERSION && <span className="release-badge">VERSIÓN ACTUAL</span>}</header>
        <ul>{release.changes.map(change => <li key={change}>{change}</li>)}</ul>
        {'pending' in release && <p className="release-pending"><strong>Pendiente:</strong> {release.pending}</p>}
      </li>)}
    </ol>
  </section>
}
