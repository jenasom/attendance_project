import React, { useState, useEffect } from 'react';
import { FingerprintScanResult } from '../../types';

interface FingerprintScannerProps {
  onScanComplete: (result: FingerprintScanResult) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
}

const FingerprintScanner: React.FC<FingerprintScannerProps> = ({
  onScanComplete,
  isScanning,
  onStartScan,
  onStopScan
}) => {
  const [status, setStatus] = useState<string>('Ready to scan');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isScanning) {
      setStatus('Place finger on scanner...');
      setProgress(0);
      
      // Simulate scanning progress
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            simulateScanComplete();
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } else {
      setStatus('Ready to scan');
      setProgress(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isScanning]);

  const simulateScanComplete = async () => {
    try {
      // Call the Python fingerprint service
      const response = await fetch('http://localhost:5000/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus('Scan completed successfully');
        onScanComplete({
          success: true,
          template: result.template,
          image: result.image
        });
      } else {
        setStatus('Scan failed');
        onScanComplete({
          success: false,
          error: result.error || 'Failed to capture fingerprint'
        });
      }
    } catch (error) {
      setStatus('Scanner connection failed');
      onScanComplete({
        success: false,
        error: 'Unable to connect to fingerprint scanner. Please ensure the DigitalPersona scanner is connected and the service is running.'
      });
    }
    
    onStopScan();
  };

  return (
    <div className="fingerprint-scanner">
      <div className="card">
        <div className="card-body text-center">
          <div className="mb-4">
            <i 
              className={`fas fa-fingerprint fa-5x ${
                isScanning ? 'text-primary scanning' : 'text-muted'
              }`}
            ></i>
          </div>
          
          <h5 className="card-title">{status}</h5>
          
          {isScanning && (
            <div className="mb-3">
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {progress}%
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3">
            {!isScanning ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={onStartScan}
              >
                <i className="fas fa-fingerprint me-2"></i>
                Start Scan
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-lg"
                onClick={onStopScan}
              >
                <i className="fas fa-stop me-2"></i>
                Stop Scan
              </button>
            )}
          </div>
          
          <div className="mt-3">
            <small className="text-muted">
              Ensure your DigitalPersona U.are.U 4500 scanner is connected
            </small>
          </div>
        </div>
      </div>

      <style>{`
        .scanning {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default FingerprintScanner;
