/**
 * StatusCheck Page Component
 * Track visa application status
 */

import { useState } from 'react';
import './StatusCheck.css';

function StatusCheck() {
  const [applicationId, setApplicationId] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setStatusData(null);
    setIsLoading(true);

    try {
      // TODO: Call API endpoint
      // const response = await fetch(`/api/visa/${applicationId}/status`);
      // const data = await response.json();

      // Mock data for demo
      const mockData = {
        applicationId: applicationId,
        status: 'processing',
        statusLabel: 'Under Review',
        submittedDate: '2026-07-01',
        estimatedCompletion: '2026-07-10',
        progress: 60,
        timeline: [
          {
            step: 'Application Submitted',
            date: '2026-07-01',
            completed: true,
          },
          {
            step: 'Document Verification',
            date: '2026-07-03',
            completed: true,
          },
          {
            step: 'Under Review',
            date: '2026-07-05',
            completed: true,
          },
          {
            step: 'Background Check',
            date: '2026-07-08',
            completed: false,
          },
          {
            step: 'Decision',
            date: '2026-07-10',
            completed: false,
          },
        ],
      };

      setStatusData(mockData);
    } catch (err) {
      setError('Failed to fetch application status. Please check your Application ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'processing':
        return 'status-processing';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="status-check-page">
      <div className="notice-bar">
        <div className="notice-icon">🔥</div>
        <div className="notice-scroll">
          <div className="notice-text">
            <span>🌍 50+ Countries | ✨ Fast Processing 3-7 Days | 📋 98% Success Rate | 💳 Secure Payment</span>
          </div>
        </div>
      </div>

      <div className="status-header-card">
        <div className="status-avatar">
          <i className="fas fa-search"></i>
        </div>
        <div className="status-header-info">
          <h3>Track Your Application</h3>
          <p>Enter your Application ID to check status</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="Enter Application ID (e.g., VISA-2026-001234)"
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
              </>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-alert">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {statusData && (
        <div className="status-results">
          {/* Status Header Card */}
          <div className={`status-card ${getStatusColor(statusData.status)}`}>
            <div className="status-badge">{statusData.statusLabel}</div>
            <div className="status-info">
              <p className="app-id">Application ID: {statusData.applicationId}</p>
              <p className="submitted-date">Submitted: {statusData.submittedDate}</p>
              <p className="est-date">Est. Completion: {statusData.estimatedCompletion}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <h4>Application Progress</h4>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${statusData.progress}%` }}
              ></div>
            </div>
            <p className="progress-text">{statusData.progress}% Complete</p>
          </div>

          {/* Timeline */}
          <div className="timeline-section">
            <h4>Processing Timeline</h4>
            <div className="timeline">
              {statusData.timeline.map((item, index) => (
                <div
                  key={index}
                  className={`timeline-item ${item.completed ? 'completed' : ''}`}
                >
                  <div className="timeline-dot">
                    {item.completed ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      <i className="fas fa-clock"></i>
                    )}
                  </div>
                  <div className="timeline-content">
                    <h5>{item.step}</h5>
                    <p>{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => setStatusData(null)}>
              <i className="fas fa-search"></i> Search Again
            </button>
            <button className="btn btn-primary">
              <i className="fas fa-download"></i> Download Certificate
            </button>
          </div>
        </div>
      )}

      {!statusData && !error && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-magnifying-glass"></i>
          </div>
          <h3>Track Your Visa Application</h3>
          <p>Enter your Application ID above to see the status and processing timeline</p>
          <div className="info-box">
            <i className="fas fa-info-circle"></i>
            <p>
              Your Application ID was provided in your confirmation email. It starts with "VISA-".
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusCheck;
