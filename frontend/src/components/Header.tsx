/**
 * Header Component
 * Navigation and branding
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header" id="mainHeader">
      <div className="header-left">
        <Link to="/" className="logo">
          Fly<span>Trip</span>Visa |飞行旅行签证
        </Link>
      </div>
      
      <div className="header-right">
        <button className="icon-btn fly-ai-btn" title="AI Chat">
          <i className="fas fa-robot"></i>
        </button>
        
        <button className="icon-btn" id="menuBtn" onClick={toggleMenu} title="Menu">
          <i className="fas fa-bars"></i>
        </button>
        
        <div className={`menu-dropdown ${menuOpen ? 'active' : ''}`} id="menuDropdown">
          <Link
            to="/"
            className={`menu-item ${isActive('/')}`}
            onClick={closeMenu}
          >
            <i className="fas fa-home"></i> Home
          </Link>
          
          <Link
            to="/visa-apply"
            className={`menu-item ${isActive('/visa-apply')}`}
            onClick={closeMenu}
          >
            <i className="fas fa-paper-plane"></i> Visa Apply
          </Link>
          
          <Link
            to="/status-check"
            className={`menu-item ${isActive('/status-check')}`}
            onClick={closeMenu}
          >
            <i className="fas fa-search"></i> Status Check
          </Link>
          
          <Link
            to="/login"
            className={`menu-item ${isActive('/login')}`}
            onClick={closeMenu}
          >
            <i className="fas fa-sign-in-alt"></i> Login/Admin
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
