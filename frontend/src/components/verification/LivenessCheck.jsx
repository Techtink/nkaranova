import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiCamera,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiSmile,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../../services/api';
import './LivenessCheck.scss';

const CHALLENGE_ICONS = {
  turn_left: FiArrowLeft,
  turn_right: FiArrowRight,
  look_up: FiArrowUp,
  look_down: FiArrowDown,
  blink: FiEye,
  smile: FiSmile
};

export default function LivenessCheck({ onComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle, starting, active, verifying, completed, failed
  const [session, setSession] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture frame from video
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image for selfie view
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Start liveness session
  const startSession = async () => {
    setStatus('starting');
    setError(null);

    try {
      await startCamera();

      const response = await api.post('/verification/liveness/start', {
        numChallenges: 3
      });

      if (response.data.success) {
        setSession(response.data.data);
        setCurrentChallenge(response.data.data.challenges[0]);
        setStatus('active');

        // Countdown before first challenge
        setCountdown(3);
      }
    } catch (err) {
      console.error('Start session error:', err);
      setError('Failed to start verification. Please try again.');
      setStatus('failed');
    }
  };

  // Verify current challenge
  const verifyChallenge = async () => {
    if (!session || !currentChallenge) return;

    setStatus('verifying');
    setFeedback(null);

    const frame = captureFrame();
    if (!frame) {
      setError('Failed to capture image');
      setStatus('active');
      return;
    }

    try {
      const response = await api.post('/verification/liveness/verify', {
        sessionId: session.sessionId,
        challengeIndex: currentChallenge.index,
        frame
      });

      const result = response.data;

      if (result.passed) {
        setCompletedChallenges(prev => [...prev, currentChallenge.index]);

        if (result.sessionComplete) {
          setStatus('completed');
          toast.success('Liveness verification successful!');

          if (onComplete) {
            onComplete({
              success: true,
              confidence: result.confidence
            });
          }
        } else if (result.nextChallenge) {
          setCurrentChallenge(result.nextChallenge);
          setCountdown(3);
          setStatus('active');
        }
      } else {
        setFeedback(result.hint || result.message || 'Please try again');
        setStatus('active');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setFeedback('Verification failed. Please try again.');
      setStatus('active');
    }
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-capture when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && status === 'active') {
      verifyChallenge();
    }
  }, [countdown, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle cancel
  const handleCancel = () => {
    stopCamera();
    if (onCancel) onCancel();
  };

  // Handle retry
  const handleRetry = () => {
    setSession(null);
    setCurrentChallenge(null);
    setCompletedChallenges([]);
    setError(null);
    setFeedback(null);
    setStatus('idle');
    stopCamera();
  };

  // Render challenge icon
  const ChallengeIcon = currentChallenge ? CHALLENGE_ICONS[currentChallenge.type] : FiCamera;

  return (
    <div className="liveness-check">
      <div className="liveness-header">
        <h2>Face Verification</h2>
        <p>Follow the instructions to verify your identity</p>
      </div>

      {/* Progress indicator */}
      {session && (
        <div className="progress-bar">
          {session.challenges.map((_, idx) => (
            <div
              key={idx}
              className={`progress-step ${
                completedChallenges.includes(idx) ? 'completed' :
                currentChallenge?.index === idx ? 'active' : ''
              }`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="liveness-content">
        {status === 'idle' && (
          <div className="idle-state">
            <div className="camera-placeholder">
              <FiCamera />
            </div>
            <p>We need to verify that you're a real person. You'll be asked to perform a few simple actions.</p>
            <button className="btn btn-primary" onClick={startSession}>
              Start Verification
            </button>
          </div>
        )}

        {(status === 'starting' || status === 'active' || status === 'verifying') && (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Face guide overlay */}
            <div className="face-guide">
              <div className="oval-guide" />
            </div>

            {/* Challenge instruction */}
            {currentChallenge && status === 'active' && (
              <div className="challenge-overlay">
                <div className="challenge-icon">
                  <ChallengeIcon />
                </div>
                <p className="challenge-instruction">
                  {currentChallenge.instruction}
                </p>
                {countdown !== null && countdown > 0 && (
                  <div className="countdown">{countdown}</div>
                )}
              </div>
            )}

            {/* Verifying state */}
            {status === 'verifying' && (
              <div className="verifying-overlay">
                <div className="spinner" />
                <p>Verifying...</p>
              </div>
            )}

            {/* Feedback */}
            {feedback && status === 'active' && (
              <div className="feedback-message">
                <FiXCircle />
                <span>{feedback}</span>
              </div>
            )}
          </div>
        )}

        {status === 'completed' && (
          <div className="completed-state">
            <div className="success-icon">
              <FiCheckCircle />
            </div>
            <h3>Verification Complete!</h3>
            <p>Your identity has been verified successfully.</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="failed-state">
            <div className="error-icon">
              <FiXCircle />
            </div>
            <h3>Verification Failed</h3>
            <p>{error || 'Something went wrong. Please try again.'}</p>
            <button className="btn btn-primary" onClick={handleRetry}>
              <FiRefreshCw /> Try Again
            </button>
          </div>
        )}

        {error && status !== 'failed' && (
          <div className="error-message">
            <FiXCircle />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="liveness-actions">
        {status === 'active' && (
          <>
            <button
              className="btn btn-primary"
              onClick={verifyChallenge}
              disabled={countdown !== null && countdown > 0}
            >
              Capture Now
            </button>
            <button className="btn btn-outline" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
