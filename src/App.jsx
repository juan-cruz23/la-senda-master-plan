import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MasterplanView from './views/MasterplanView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MasterplanView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
