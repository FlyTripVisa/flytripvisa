/**
 * Footer Component
 */

import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fly-footer">
      <div className="footer-content">
        <p>&copy; {currentYear} FlyTripVisa. All rights reserved.</p>
        <p>Fast AI-Powered Online Visa Application Assistant</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="divider">•</span>
          <a href="#terms">Terms of Service</a>
          <span className="divider">•</span>
          <a href="#contact">Contact Us</a>
        </div>
        <p className="contact-info">Phone: +8801338354383</p>
      </div>
    </footer>
  );
}

export default Footer;
