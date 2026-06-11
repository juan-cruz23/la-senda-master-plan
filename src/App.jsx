import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MasterplanView from './views/MasterplanView'
import { preloadAllImages } from './utils/preloadImages'

export default function App() {
  useEffect(() => { preloadAllImages() }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MasterplanView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
