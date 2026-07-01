/**
 * Main Application Component
 * Handles routing and layout for all pages
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import VisaApply from './pages/VisaApply';
import StatusCheck from './pages/StatusCheck';
import Login from './pages/Login';
import ChatBot from './components/ChatBot';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visa-apply" element={<VisaApply />} />
            <Route path="/status-check" element={<StatusCheck />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        
        <Footer />
        <ChatBot />
      </div>
    </Router>
  );
}

export default App;
