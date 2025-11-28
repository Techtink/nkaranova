import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiShield,
  FiCheck,
  FiX,
  FiCamera,
  FiUpload,
  FiAlertCircle,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import LivenessCheck from '../../components/verification/LivenessCheck';
import { verificationAPI } from '../../services/api';
import './Verification.scss';

export default function TailorVerification() {
  const { user, tailorProfile, updateTailorProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [step, setStep] = useState('overview'); // overview, liveness, documents, review
  const [livenessResult, setLivenessResult] = useState(null);
  const [idDocument, setIdDocument] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [faceMatchResult, setFaceMatchResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      const [statusRes, requirementsRes] = await Promise.all([
        verificationAPI.getStatus().catch(() => ({ data: { success: true, data: { status: 'not_started' } } })),
        verificationAPI.getRequirements()
      ]);

      if (statusRes.data.success) {
        setVerificationStatus(statusRes.data.data);
      }
      if (requirementsRes.data.success) {
        setRequirements(requirementsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load verification data:', error);
      toast.error('Failed to load verification information');
    } finally {
      setLoading(false);
    }
  };

  const handleLivenessComplete = (result) => {
    setLivenessResult(result);
    if (result.success) {
      setSelfieImage(result.selfieFrame);
      toast.success('Liveness verification passed!');
      setStep('documents');
    } else {
      toast.error(result.message || 'Liveness verification failed');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setIdPreview(e.target.result);
      setIdDocument(e.target.result.split(',')[1]); // Base64 without prefix
    };
    reader.readAsDataURL(file);
  };

  const handleFaceMatch = async () => {
    if (!idDocument || !selfieImage) {
      toast.error('Please complete all verification steps');
      return;
    }

    setSubmitting(true);
    try {
      const response = await verificationAPI.compareFaceWithID(idDocument, selfieImage);

      if (response.data.success) {
        setFaceMatchResult(response.data.data);
        if (response.data.data.matched) {
          toast.success('Face verification successful!');
          setStep('review');
        } else {
          toast.error('Face comparison did not match. Please try again with clearer photos.');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Face comparison failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    try {
      const documents = {
        idDocument,
        selfie: selfieImage,
        livenessSessionId: livenessResult?.sessionId
      };

      const response = await verificationAPI.submitVerification(documents);

      if (response.data.success) {
        toast.success('Verification submitted successfully!');
        setVerificationStatus({ status: 'pending' });
        updateTailorProfile({ verificationStatus: 'pending' });
        setStep('overview');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="status-badge verified"><FiCheckCircle /> Verified</span>;
      case 'pending':
        return <span className="status-badge pending"><FiClock /> Pending Review</span>;
      case 'rejected':
        return <span className="status-badge rejected"><FiX /> Rejected</span>;
      default:
        return <span className="status-badge not-started"><FiAlertCircle /> Not Verified</span>;
    }
  };

  if (loading) {
    return (
      <div className="tailor-verification-page page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tailor-verification-page page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <FiShield className="header-icon" />
            <div>
              <h1>Identity Verification</h1>
              <p>Verify your identity to build trust with customers</p>
            </div>
          </div>
          {verificationStatus && getStatusBadge(verificationStatus.status)}
        </div>

        {step === 'overview' && (
          <div className="verification-overview">
            {/* Status Card */}
            <div className="status-card">
              <h2>Verification Status</h2>
              {verificationStatus?.status === 'verified' ? (
                <div className="verified-content">
                  <FiCheckCircle className="success-icon" />
                  <h3>You're Verified!</h3>
                  <p>Your identity has been verified. Customers can see the verified badge on your profile.</p>
                </div>
              ) : verificationStatus?.status === 'pending' ? (
                <div className="pending-content">
                  <FiClock className="pending-icon" />
                  <h3>Verification Pending</h3>
                  <p>Your verification documents are being reviewed. This usually takes 1-2 business days.</p>
                </div>
              ) : verificationStatus?.status === 'rejected' ? (
                <div className="rejected-content">
                  <FiX className="rejected-icon" />
                  <h3>Verification Rejected</h3>
                  <p>{verificationStatus.rejectionReason || 'Please try again with clearer documents.'}</p>
                  <Button onClick={() => setStep('liveness')}>Try Again</Button>
                </div>
              ) : (
                <div className="not-started-content">
                  <FiShield className="shield-icon" />
                  <h3>Get Verified</h3>
                  <p>Complete identity verification to get a verified badge on your profile and increase customer trust.</p>
                  <Button onClick={() => setStep('liveness')}>Start Verification</Button>
                </div>
              )}
            </div>

            {/* Requirements Card */}
            {requirements && (
              <div className="requirements-card">
                <h2>Verification Requirements</h2>

                <div className="requirements-list">
                  <h3>Required Documents</h3>
                  {requirements.documents.filter(d => d.required).map((doc, index) => (
                    <div key={index} className="requirement-item">
                      <FiCheck />
                      <div>
                        <strong>{doc.name}</strong>
                        <span>{doc.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="guidelines-list">
                  <h3>Photo Guidelines</h3>
                  <ul>
                    {requirements.guidelines.map((guideline, index) => (
                      <li key={index}>{guideline}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Benefits Card */}
            <div className="benefits-card">
              <h2>Benefits of Verification</h2>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <FiShield />
                  <span>Verified badge on your profile</span>
                </div>
                <div className="benefit-item">
                  <FiCheck />
                  <span>Increased customer trust</span>
                </div>
                <div className="benefit-item">
                  <FiCamera />
                  <span>Higher visibility in search</span>
                </div>
                <div className="benefit-item">
                  <FiCheckCircle />
                  <span>Access to premium features</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'liveness' && (
          <div className="verification-step liveness-step">
            <div className="step-header">
              <h2>Step 1: Liveness Check</h2>
              <p>Complete a quick face scan to prove you're a real person</p>
            </div>

            <LivenessCheck
              onComplete={handleLivenessComplete}
              onCancel={() => setStep('overview')}
            />
          </div>
        )}

        {step === 'documents' && (
          <div className="verification-step documents-step">
            <div className="step-header">
              <h2>Step 2: ID Document</h2>
              <p>Upload a clear photo of your government-issued ID</p>
            </div>

            <div className="documents-content">
              {/* Selfie Preview */}
              <div className="selfie-preview">
                <h3>Your Selfie</h3>
                {selfieImage ? (
                  <div className="image-preview">
                    <img src={`data:image/jpeg;base64,${selfieImage}`} alt="Selfie" />
                    <FiCheckCircle className="check-icon" />
                  </div>
                ) : (
                  <div className="no-image">
                    <FiCamera />
                    <span>No selfie captured</span>
                  </div>
                )}
              </div>

              {/* ID Upload */}
              <div className="id-upload">
                <h3>Government ID</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {idPreview ? (
                  <div className="image-preview">
                    <img src={idPreview} alt="ID Document" />
                    <button
                      className="change-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUpload />
                    <span>Click to upload ID</span>
                    <small>Passport, National ID, or Driver's License</small>
                  </div>
                )}
              </div>
            </div>

            <div className="step-actions">
              <Button variant="secondary" onClick={() => setStep('liveness')}>
                Back
              </Button>
              <Button
                onClick={handleFaceMatch}
                loading={submitting}
                disabled={!idDocument || !selfieImage}
              >
                Verify Face Match
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="verification-step review-step">
            <div className="step-header">
              <h2>Step 3: Review & Submit</h2>
              <p>Review your verification details before submitting</p>
            </div>

            <div className="review-content">
              <div className="review-item">
                <h3>Liveness Check</h3>
                <div className="status-row">
                  <FiCheckCircle className="success" />
                  <span>Passed</span>
                </div>
              </div>

              <div className="review-item">
                <h3>Face Match</h3>
                <div className="status-row">
                  <FiCheckCircle className="success" />
                  <span>
                    Matched ({faceMatchResult?.confidence?.toFixed(1)}% confidence)
                  </span>
                </div>
              </div>

              <div className="review-item">
                <h3>Documents</h3>
                <div className="documents-preview">
                  <img src={`data:image/jpeg;base64,${selfieImage}`} alt="Selfie" />
                  <img src={idPreview} alt="ID" />
                </div>
              </div>

              <div className="review-notice">
                <FiAlertCircle />
                <p>
                  By submitting, you confirm that all information is accurate and
                  the documents belong to you. Verification typically takes 1-2 business days.
                </p>
              </div>
            </div>

            <div className="step-actions">
              <Button variant="secondary" onClick={() => setStep('documents')}>
                Back
              </Button>
              <Button
                onClick={handleSubmitVerification}
                loading={submitting}
              >
                Submit Verification
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
