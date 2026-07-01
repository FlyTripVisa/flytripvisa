/**
 * ChatBot Component
 * Floating AI assistant button and chat interface
 */

import { useState } from 'react';
import './ChatBot.css';

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Visa Assistant</h3>
            <button className="close-btn" onClick={handleToggle}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="chat-messages">
            <div className="message bot-message">
              <p>Hello! How can I help you with your visa application today?</p>
            </div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Ask me anything..." />
            <button><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
      )}
      
      <button className="ai-chat-btn" id="aiChatBtn" onClick={handleToggle} title="AI Chat">
        <i className="fas fa-robot"></i>
      </button>
    </div>
  );
}

export default ChatBot;
