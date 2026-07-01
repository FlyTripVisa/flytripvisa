/**
 * VisaApply Page Component
 * Visa application form with AI guidance
 */

import { useState } from 'react';
import './VisaApply.css';

function VisaApply() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    destinationCountry: '',
    visaType: '',
    passportNumber: '',
    dateOfBirth: '',
    nationality: '',
    documents: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }));
  };

  const removeDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Send to API endpoint
      // const response = await fetch('/api/visa/apply', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      setSuccessMessage('✅ Application submitted successfully! Application ID: VISA-2026-001234');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        destinationCountry: '',
        visaType: '',
        passportNumber: '',
        dateOfBirth: '',
        nationality: '',
        documents: [],
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="visa-apply-page">
      <div className="notice-bar">
        <div className="notice-icon">🔥</div>
        <div className="notice-scroll">
          <div className="notice-text">
            <span>🌍 50+ Countries | ✨ Fast Processing 3-7 Days | 📋 98% Success Rate | 💳 Secure Payment</span>
          </div>
        </div>
      </div>

      <div className="apply-header-card">
        <div className="apply-avatar">
          <i className="fas fa-paper-plane"></i>
        </div>
        <div className="apply-header-info">
          <h3>Visa Application Form</h3>
          <p>Step {currentStep} of 3 · Complete your application</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-alert">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="visa-form">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="form-step">
            <h3>Personal Information</h3>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+8801234567890"
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Nationality *</label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your nationality</option>
                <option value="BD">Bangladesh</option>
                <option value="IN">India</option>
                <option value="PK">Pakistan</option>
                <option value="CN">China</option>
                <option value="US">United States</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Visa Details */}
        {currentStep === 2 && (
          <div className="form-step">
            <h3>Visa Details</h3>

            <div className="form-group">
              <label>Destination Country *</label>
              <select
                name="destinationCountry"
                value={formData.destinationCountry}
                onChange={handleInputChange}
                required
              >
                <option value="">Select destination</option>
                <option value="AE">United Arab Emirates</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>

            <div className="form-group">
              <label>Visa Type *</label>
              <select
                name="visaType"
                value={formData.visaType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select visa type</option>
                <option value="tourist">Tourist Visa</option>
                <option value="business">Business Visa</option>
                <option value="work">Work Visa</option>
                <option value="student">Student Visa</option>
                <option value="residence">Residence Visa</option>
              </select>
            </div>

            <div className="form-group">
              <label>Passport Number *</label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleInputChange}
                placeholder="AB123456"
                required
              />
            </div>
          </div>
        )}

        {/* Step 3: Document Upload */}
        {currentStep === 3 && (
          <div className="form-step">
            <h3>Required Documents</h3>
            <p className="step-info">Upload scanned copies of your documents (PDF, DOC, JPG, PNG)</p>

            <div className="upload-area">
              <input
                type="file"
                id="documentUpload"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
              />
              <label htmlFor="documentUpload" className="upload-label">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Click to upload or drag and drop</p>
              </label>
            </div>

            {formData.documents.length > 0 && (
              <div className="documents-list">
                <h4>Uploaded Documents ({formData.documents.length})</h4>
                {formData.documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <i className="fas fa-file"></i>
                    <span>{doc.name}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeDocument(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <i className="fas fa-chevron-left"></i> Back
            </button>
          )}

          {currentStep < 3 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Submit Application
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default VisaApply;
