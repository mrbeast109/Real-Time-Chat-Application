import React from 'react'
import { Routes, Route } from "react-router-dom"
import Home from './Pages/Home'
import Chats from './Pages/Chats'
import Login from './Pages/Login'
import Signup from './Pages/Signup'

function App () {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/chats' element={<Chats />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
    </Routes>
  )
}

export default App;
