import garota1 from '../assets/avatars/garota1.png'
import garota2 from '../assets/avatars/garota2.png'
import garota3 from '../assets/avatars/garota3.png'
import garota4 from '../assets/avatars/garota4.png'
import garoto1 from '../assets/avatars/garoto1.png'
import garoto2 from '../assets/avatars/garoto2.png'
import garoto3 from '../assets/avatars/garoto3.png'
import garoto4 from '../assets/avatars/garoto4.png'
import garoto5 from '../assets/avatars/garoto5.png'

export const AVATAR_LIST = [
  { key: 'garota1.png', src: garota1, label: 'Menina 1' },
  { key: 'garota2.png', src: garota2, label: 'Menina 2' },
  { key: 'garota3.png', src: garota3, label: 'Menina 3' },
  { key: 'garota4.png', src: garota4, label: 'Maria Clara' },
  { key: 'garoto1.png', src: garoto1, label: 'Menino 1' },
  { key: 'garoto2.png', src: garoto2, label: 'Menino 2' },
  { key: 'garoto3.png', src: garoto3, label: 'Samuel' },
  { key: 'garoto4.png', src: garoto4, label: 'Isaac' },
  { key: 'garoto5.png', src: garoto5, label: 'Nicolas' },
]

const AVATAR_MAP = Object.fromEntries(AVATAR_LIST.map(a => [a.key, a.src]))

// Resolve qualquer formato de photo salvo no IndexedDB:
// - 'garota1.png'  → asset importado (novo fluxo)
// - 'data:image/…' → foto uploadada (mantém)
// - emoji/null     → avatar padrão
export function resolveAvatar(photo) {
  if (!photo) return garota1
  if (photo.startsWith('data:')) return photo
  return AVATAR_MAP[photo] ?? garota1
}
