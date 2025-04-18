import React from 'react';
import HomeNews from './Components/HomeNews/HomeNews.jsx'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return(
    <Router>
      <Routes>
          <Route path = '/' element = {<HomeNews/>}></Route>
      </Routes>
    </Router>
  )
}

export default App;