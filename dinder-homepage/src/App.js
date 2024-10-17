import React from 'react';
import Header from './components/Header';
import MainSection from './components/MainSection';
import Footer from './components/Footer';
import './App.css'; // General styles

function App() {
  return (
    <div className="App">
      <Header />
      <MainSection />
      <Footer />
    </div>
  );
}

export default App;
