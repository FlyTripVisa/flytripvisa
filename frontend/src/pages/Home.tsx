/**
 * Home Page
 * Landing page with hero section and feature showcase
 */

import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Fast Visa Application</h1>
        <p>AI-Powered assistance for your visa journey</p>
        <div className="hero-buttons">
          <Link to="/visa-apply" className="btn btn-primary">
            <i className="fas fa-paper-plane"></i> Apply Now
          </Link>
          <Link to="/status-check" className="btn btn-secondary">
            <i className="fas fa-search"></i> Check Status
          </Link>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose FlyTripVisa?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-robot"></i>
            </div>
            <h3>AI Assistance</h3>
            <p>Get instant help with visa requirements and documentation</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <h3>Fast Processing</h3>
            <p>Quick and efficient visa application process</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h3>Secure & Safe</h3>
            <p>Your data is encrypted and protected at all times</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-globe"></i>
            </div>
            <h3>Global Coverage</h3>
            <p>Support for visa applications to multiple countries</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Apply</h3>
            <p>Fill out your visa application with AI guidance</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Upload</h3>
            <p>Submit required documents securely</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Track</h3>
            <p>Monitor your application status in real-time</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Start Your Visa Journey?</h2>
        <p>Join thousands of users who have successfully applied for their visas</p>
        <Link to="/visa-apply" className="btn btn-primary">
          Get Started
        </Link>
      </section>
    </div>
  );
}

export default Home;
