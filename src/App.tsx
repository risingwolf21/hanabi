import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import GamePage from '@/pages/GamePage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </HashRouter>
  )
}
