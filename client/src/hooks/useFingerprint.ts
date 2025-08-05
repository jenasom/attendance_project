import { useState, useCallback, useRef, useEffect } from 'react';
import { FINGERPRINT_CONFIG, SCANNER_STATUS, API_CONFIG } from '../utils/constants';

export interface FingerprintScanResult {
  success: boolean;
  template?: string;
  image?: string;
  quality?: number;
  error?: string;
}

export interface ScannerStatus {
  status: typeof SCANNER_STATUS[keyof typeof SCANNER_STATUS];
  message: string;
  connected: boolean;
}

interface FingerprintHookState {
  isScanning: boolean;
  scanProgress: number;
  scannerStatus: ScannerStatus;
  lastScanResult: FingerprintScanResult | null;
  error: string | null;
}

interface FingerprintHookActions {
  startScan: () => Promise<FingerprintScanResult>;
  stopScan: () => void;
  checkScannerStatus: () => Promise<ScannerStatus>;
  resetError: () => void;
  resetScanResult: () => void;
}

export interface UseFingerprintReturn extends FingerprintHookState, FingerprintHookActions {}

/**
 * Custom hook for fingerprint scanning operations
 */
export const useFingerprint = (): UseFingerprintReturn => {
  const [state, setState] = useState<FingerprintHookState>({
    isScanning: false,
    scanProgress: 0,
    scannerStatus: {
      status: SCANNER_STATUS.DISCONNECTED,
      message: 'Checking scanner connection...',
      connected: false,
    },
    lastScanResult: null,
    error: null,
  });

  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Update scanner status
   */
  const updateScannerStatus = useCallback(async (): Promise<ScannerStatus> => {
    try {
      const response = await fetch(`${API_CONFIG.PYTHON_SERVER_URL}/scanner/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.status) {
        const newStatus: ScannerStatus = {
          status: data.status.connected ? SCANNER_STATUS.CONNECTED : SCANNER_STATUS.DISCONNECTED,
          message: data.status.connected 
            ? `Scanner ready: ${data.status.device_name || 'DigitalPersona Scanner'}`
            : 'Scanner not connected. Please check connection.',
          connected: data.status.connected,
        };

        setState(prev => ({ ...prev, scannerStatus: newStatus }));
        return newStatus;
      } else {
        throw new Error(data.error || 'Failed to get scanner status');
      }
    } catch (error: any) {
      const errorStatus: ScannerStatus = {
        status: SCANNER_STATUS.ERROR,
        message: error.name === 'AbortError' 
          ? 'Scanner status check timed out'
          : `Scanner error: ${error.message}`,
        connected: false,
      };

      setState(prev => ({ ...prev, scannerStatus: errorStatus }));
      return errorStatus;
    }
  }, []);

  /**
   * Start fingerprint scanning
   */
  const startScan = useCallback(async (): Promise<FingerprintScanResult> => {
    return new Promise((resolve) => {
      // Reset previous state
      setState(prev => ({
        ...prev,
        isScanning: true,
        scanProgress: 0,
        error: null,
        lastScanResult: null,
      }));

      // Update scanner status to scanning
      setState(prev => ({
        ...prev,
        scannerStatus: {
          ...prev.scannerStatus,
          status: SCANNER_STATUS.SCANNING,
          message: 'Place finger on scanner...',
        },
      }));

      // Create abort controller for this scan
      abortControllerRef.current = new AbortController();

      // Start progress simulation
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;
        
        setState(prev => ({ ...prev, scanProgress: Math.min(progress, 95) }));
      }, FINGERPRINT_CONFIG.PROGRESS_UPDATE_INTERVAL);

      // Set timeout for scan
      scanTimeoutRef.current = setTimeout(() => {
        const timeoutResult: FingerprintScanResult = {
          success: false,
          error: 'Scan timeout. Please try again.',
        };
        
        finishScan(timeoutResult);
        resolve(timeoutResult);
      }, FINGERPRINT_CONFIG.SCAN_TIMEOUT);

      // Perform actual scan
      const performScan = async () => {
        try {
          const response = await fetch(`${API_CONFIG.PYTHON_SERVER_URL}/capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          // Complete progress
          setState(prev => ({ ...prev, scanProgress: 100 }));

          if (data.success) {
            const successResult: FingerprintScanResult = {
              success: true,
              template: data.template,
              image: data.image,
              quality: data.quality || 0,
            };
            
            finishScan(successResult);
            resolve(successResult);
          } else {
            const errorResult: FingerprintScanResult = {
              success: false,
              error: data.error || 'Failed to capture fingerprint',
            };
            
            finishScan(errorResult);
            resolve(errorResult);
          }
        } catch (error: any) {
          const errorResult: FingerprintScanResult = {
            success: false,
            error: error.name === 'AbortError' 
              ? 'Scan was cancelled'
              : `Scan failed: ${error.message}`,
          };
          
          finishScan(errorResult);
          resolve(errorResult);
        }
      };

      performScan();
    });
  }, []);

  /**
   * Stop fingerprint scanning
   */
  const stopScan = useCallback(() => {
    // Abort current scan
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear timeouts and intervals
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Reset state
    setState(prev => ({
      ...prev,
      isScanning: false,
      scanProgress: 0,
      scannerStatus: {
        ...prev.scannerStatus,
        status: prev.scannerStatus.connected ? SCANNER_STATUS.CONNECTED : SCANNER_STATUS.DISCONNECTED,
        message: prev.scannerStatus.connected ? 'Scanner ready' : 'Scanner not connected',
      },
    }));
  }, []);

  /**
   * Finish scan and cleanup
   */
  const finishScan = useCallback((result: FingerprintScanResult) => {
    // Clear timeouts and intervals
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Update state
    setState(prev => ({
      ...prev,
      isScanning: false,
      scanProgress: result.success ? 100 : 0,
      lastScanResult: result,
      error: result.success ? null : result.error || 'Unknown error',
      scannerStatus: {
        ...prev.scannerStatus,
        status: prev.scannerStatus.connected ? SCANNER_STATUS.CONNECTED : SCANNER_STATUS.DISCONNECTED,
        message: result.success 
          ? 'Scan completed successfully'
          : result.error || 'Scan failed',
      },
    }));
  }, []);

  /**
   * Check scanner status
   */
  const checkScannerStatus = useCallback(async (): Promise<ScannerStatus> => {
    return updateScannerStatus();
  }, [updateScannerStatus]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset scan result
   */
  const resetScanResult = useCallback(() => {
    setState(prev => ({ ...prev, lastScanResult: null }));
  }, []);

  // Check scanner status on mount
  useEffect(() => {
    updateScannerStatus();
  }, [updateScannerStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  return {
    ...state,
    startScan,
    stopScan,
    checkScannerStatus,
    resetError,
    resetScanResult,
  };
};

export default useFingerprint;
