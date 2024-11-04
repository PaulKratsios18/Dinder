import React from 'react';
import './Header.css';
import { useNavigate } from 'react-router-dom';
import dinderLogo from '../assets/DinderLogoV1.png';

function Header() {
  const navigate = useNavigate();

  const handleIconClick = () => {
    navigate('/');
  };

  return (
    <header>
      <div className="logo" id="header">
        <img
          src={dinderLogo}
          alt="Dinder Logo"
          className="header-icon"
          onClick={handleIconClick}
          style={{ cursor: 'pointer' }}/>
        <h1>Dinder</h1>
      </div>
    </header>
  );
}

export default Header;