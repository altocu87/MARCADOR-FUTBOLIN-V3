export interface Player {
  id: string
  name: string
  tint: string
}

export const PLAYER_COLORS = ['#ea7c6c', '#69a8e9', '#c47aee', '#e4b460', '#6acaa1', '#e993c2']

export function normalizePlayerName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

export function validatePlayerName(name: string, players: Player[], editingId?: string): string | null {
  const normalized = normalizePlayerName(name)
  if (!normalized) return 'Introduce el nombre del jugador.'
  if (normalized.length > 32) return 'El nombre puede tener hasta 32 caracteres.'
  if (players.some((player) => player.id !== editingId && player.name.toLocaleLowerCase('es') === normalized.toLocaleLowerCase('es'))) {
    return 'Ya existe un jugador con ese nombre.'
  }
  return null
}
