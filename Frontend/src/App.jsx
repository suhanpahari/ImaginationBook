import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Board1 from './pages/Board1'
import Board2 from './pages/Board2'
import Board3 from './pages/Board3'
import FrontPage from './pages/FrontPage'
import Landingpage from './pages/Landingpage'
import Draft1 from  './pages/Draft1'
import Draft2 from  './pages/Draft2'
import Draft3 from  './pages/Draft3'
 
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/home" element={<FrontPage />} />
        <Route path="/board1" element={<Board1 />} />
        <Route path="/board2" element={<Board2 />} />
        <Route path="/board3" element={<Board3 />} />
        <Route path="/draft1/:id" element={<Draft1 />} />
        <Route path="/draft2/:id" element={<Draft2 />} />
        <Route path="/draft3/:id" element={<Draft3 />} />
      </Routes>
    </Router>
  )
}
