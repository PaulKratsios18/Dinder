import React from 'react';
import Header from './components/Header';
import MainSection from './components/MainSection';
import Footer from './components/Footer';
import './App.css'; // General styles

function App() {
  return (
    <div className="App">
      <div className="page-container">
      <div className="content-wrap">
        <Header />
        <MainSection />
      </div>
      <Footer />
    </div>
    </div>
  );
}

export default App;
