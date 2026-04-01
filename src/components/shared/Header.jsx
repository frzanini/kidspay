import { useNavigate, useLocation } from 'react-router-dom'
import { UI_ICONS } from '../../lib/icons'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const isParentMode = location.pathname === '/parents'

  function toggleMode() {
    navigate(isParentMode ? '/' : '/parents')
  }

  return (
    <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
      <span className="font-bold text-indigo-600 text-lg">KidsPay</span>
      <button
        onClick={toggleMode}
        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
      >
        {isParentMode ? (
          <>
            <span>{UI_ICONS.childMode}</span>
            <span>Modo filho</span>
          </>
        ) : (
          <>
            <span>{UI_ICONS.parentMode}</span>
            <span>Modo pai</span>
          </>
        )}
      </button>
    </header>
  )
}
