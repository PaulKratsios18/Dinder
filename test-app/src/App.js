import React from 'react';
import Header from './components/Header';
import MainSection from './components/MainSection';
import Footer from './components/Footer';
import About from './components/About';
import Contact from './components/Contact';
import Services from './components/Services';
import './App.css'; // General styles

function App() {
  return (
    <div className="App">
      <div className="page-container">
      <div className="content-wrap">
        <Header />
        <MainSection />
        <About />
        <Contact />
        <Services />
      </div>
      <Footer />
    </div>
    </div>
  );
}

export default App;
