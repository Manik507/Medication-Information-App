import React, { useState, useEffect, useRef } from 'react';
import { Camera, Info, Scan, Zap, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);
      toast('Initializing scanner...', { icon: '⏳' });
      
      // We render to the div with id "reader"
      const html5QrCode = new Html5Qrcode("reader");
      scannerInstance.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText, decodedResult) => {
          // Success callback
          setScanResult(decodedText);
          toast.success(`Barcode detected: ${decodedText}`);
          stopScanner();
        },
        (errorMessage) => {
          // Parse errors are ignored, we just wait for a successful scan
        }
      );
      toast.success('Scanner ready! Point it directly at a barcode/QR code.');
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error('Failed to access camera. Please check browser permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerInstance.current && isScanning) {
      scannerInstance.current.stop().then(() => {
        scannerInstance.current.clear();
        setIsScanning(false);
      }).catch(err => {
        console.error("Failed to stop scanner", err);
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerInstance.current && scannerInstance.current.isScanning) {
        scannerInstance.current.stop().then(() => {
          scannerInstance.current.clear();
        }).catch(err => console.log(err));
      }
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl shadow-lg shadow-brand/20">
          <Scan className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Scan Medicine</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            AI-powered label recognition
          </p>
        </div>
      </div>

      {scanResult && (
        <div className="p-6 premium-glass rounded-2xl border-emerald-500/30 bg-emerald-500/5 mb-6 flex flex-col md:flex-row items-center gap-4 bg-white/5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Scan Successful</h3>
            <p className="text-[var(--text-secondary)] font-medium">Barcode / QR Content: <span className="text-emerald-500 tracking-wider font-mono">{scanResult}</span></p>
          </div>
          <button onClick={() => setScanResult(null)} className="btn-premium px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Clear Result
          </button>
        </div>
      )}

      <div className="premium-glass rounded-3xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-brand/5 transition-colors pointer-events-none z-0"></div>
        <div className={`w-full bg-[var(--bg-secondary)] flex flex-col items-center justify-center relative overflow-hidden bg-black/5 ${isScanning ? 'min-h-[400px]' : 'aspect-video'}`}>
          
          {/* Container for html5-qrcode video */}
          <div 
            id="reader" 
            ref={scannerRef}
            className={`w-full h-full relative z-10 ${isScanning ? 'block' : 'hidden'}`}
            style={{ minHeight: isScanning ? '400px' : '0' }}
          ></div>

          {!isScanning && (
            <div className="flex flex-col items-center justify-center h-full w-full py-20 relative z-10 gap-4">
              <div className={`w-48 h-48 md:w-64 md:h-64 border-4 border-brand/50 rounded-3xl relative shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-black/10`}>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-xl shadow-[inset_0_0_20px_rgba(99,102,241,0.5)]" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-xl shadow-[inset_0_0_20px_rgba(99,102,241,0.5)]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-xl shadow-[inset_0_0_20px_rgba(99,102,241,0.5)]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-xl shadow-[inset_0_0_20px_rgba(99,102,241,0.5)]" />
              </div>
              <Camera className="w-10 h-10 text-[var(--text-secondary)] absolute opacity-50 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-[var(--bg-primary)] border-t border-[var(--border-color)] relative z-10">
          {isScanning ? (
            <button onClick={stopScanner} className="w-full btn-premium py-4 transition-all flex items-center justify-center gap-3 text-lg !bg-red-500 hover:!bg-red-600 shadow-red-500/20">
              <X className="w-6 h-6" />
              Stop Scanner
            </button>
          ) : (
            <button onClick={startScanner} className="w-full btn-premium py-4 transition-all flex items-center justify-center gap-3 text-lg">
              <Scan className="w-6 h-6" />
              Initialize Scanner
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 p-5 premium-glass rounded-2xl relative overflow-hidden bg-brand/5 border-brand/20">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-accent"></div>
        <Info className="w-6 h-6 text-brand flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[var(--text-primary)] mb-1">Scanning Tips</h4>
          <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-2">
            You can scan <strong>any medicine package's standard barcode (EAN/UPC) or a QR code</strong> on a prescription label.
          </p>
          <ul className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed list-disc list-inside">
            <li>Ensure adequate lighting and hold the camera steady.</li>
            <li>Point it directly at the medication barcode or QR code.</li>
            <li>Requires browser camera permissions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
