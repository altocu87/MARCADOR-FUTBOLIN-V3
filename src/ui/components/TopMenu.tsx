export interface MenuItem {
  id: string
  label: string
}

interface TopMenuProps {
  items: MenuItem[]
  activeItem: string
  onSelect: (id: string) => void
}

export function TopMenu({ items, activeItem, onSelect }: TopMenuProps) {
  return (
    <nav className="top-menu" aria-label="Navegación principal">
      {items.map((item) => (
        <button
          className={`menu-button${activeItem === item.id ? ' is-active' : ''}`}
          type="button"
          key={item.id}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
