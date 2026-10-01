import React, { type ReactNode } from 'react'

export interface MenuItem {
  id: string
  label: string
}

interface TopMenuProps {
  items: MenuItem[]
  activeItem: string
  onSelect: (id: string) => void
  accountActions?: ReactNode
  disabled?: boolean
}

export function TopMenu({ items, activeItem, onSelect, accountActions, disabled = false }: TopMenuProps) {
  return (
    <header className="app-header">
      <div className="header-identity"><div className="app-brand"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span><b>MARCADOR</b><strong>FUTBOLÍN V3</strong></span><small>SIMULADOR WEB</small></div>{accountActions}</div>
    <nav className="top-menu" aria-label="Navegación principal">
      {items.map((item) => (
        <button
          className={`menu-button${activeItem === item.id ? ' is-active' : ''}`}
          type="button"
          disabled={disabled}
          key={item.id}
          aria-current={activeItem === item.id ? 'page' : undefined}
          onClick={() => onSelect(item.id)}
        >
          <MenuIcon id={item.id} /><span>{item.label}</span>
        </button>
      ))}
    </nav>
    </header>
  )
}

function MenuIcon({ id }: { id: string }) {
  const paths: Record<string, string> = {
    'new-match': 'M12 5v14M5 12h14',
    tournament: 'M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5m-4 2h8',
    ranking: 'M4 20V12h4v8m2 0V4h4v16m2 0V8h4v12',
    settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  }
  return <svg className="menu-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[id] ?? paths['new-match']} /></svg>
}
