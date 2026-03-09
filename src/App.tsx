import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/layout/Header'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Garden from './pages/Garden'
import NewPost from './pages/NewPost'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ThoughtRecords from './pages/ThoughtRecords'
import ThoughtRecordWizard from './components/thought-records/ThoughtRecordWizard'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>

  return (
    <Routes>
      {/* 公開ページ */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/home" replace /> : <Register />} />

      {/* 認証後ページ */}
      <Route path="/*" element={
        <AuthGuard>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/garden" element={<Garden />} />
                <Route path="/new" element={<NewPost />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/thought-records" element={<ThoughtRecords />} />
                <Route path="/thought-records/new" element={<ThoughtRecordWizard />} />
              </Routes>
            </main>
          </div>
        </AuthGuard>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
