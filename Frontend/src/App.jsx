import React from 'react';
import HomeNews from './Components/HomeNews.jsx'; 
import CategoryNews from './Components/categoryNews.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CategorySelector from './Components/categorySelector.jsx';

function App() {
  return(
    <Router>
      <CategorySelector/>
      <Routes>
          <Route path = '/' element = {<HomeNews/>}></Route>
          <Route path="/category/:category" element={<CategoryNews />} />
      </Routes>
    </Router>
  )
}

export default App;