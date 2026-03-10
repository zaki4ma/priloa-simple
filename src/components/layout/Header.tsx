import { Link, useLocation } from 'react-router-dom'
import { Home, Users, BarChart2, Brain, User, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/home', icon: Home, label: 'ホーム' },
  { to: '/garden', icon: Users, label: 'みんな' },
  { to: '/dashboard', icon: BarChart2, label: '記録' },
  { to: '/thought-records', icon: Brain, label: 'CBT' },
  { to: '/profile', icon: User, label: 'プロフィール' },
]

export default function Header() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()

  return (
    <>
      {/* desktop top bar */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <Link to="/home" className="flex items-center gap-2 text-green-600 font-bold text-xl">
          <img src="/logo_priloa.png" alt="Priloa" className="w-7 h-7" />
          Priloa
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium ${pathname === to ? 'text-green-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {label}
            </Link>
          ))}
          <button onClick={signOut} className="text-gray-400 hover:text-gray-600">
            <LogOut size={18} />
          </button>
        </nav>
      </header>

      {/* mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs ${pathname === to ? 'text-green-600' : 'text-gray-400'}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
