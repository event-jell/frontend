import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Flashlight, SwitchCamera, AlertCircle, RefreshCw } from 'lucide-react';

interface QrScannerViewProps {
  onScan: (decodedText: string) => void;
  paused?: boolean;
}

export default function QrScannerView({ onScan, paused }: QrScannerViewProps) {
  const [scannerReady, setScannerReady] = useState(false);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTextRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const containerId = 'eventjell-qr-reader';

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      if (paused) return;

      const now = Date.now();
      // Throttle: don't re-trigger same token within 3 seconds
      if (
        decodedText === lastScannedTextRef.current &&
        now - lastScannedTimeRef.current < 3000
      ) {
        return;
      }

      lastScannedTextRef.current = decodedText;
      lastScannedTimeRef.current = now;
      onScan(decodedText);
    },
    [onScan, paused],
  );

  const startScanner = useCallback(async () => {
    try {
      setHasCameraError(null);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.72);
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText) => handleScanSuccess(decodedText),
        () => {}, // ignore frame scan errors
      );

      setScannerReady(true);

      // Check for torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if ((capabilities as any)?.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera initialization error', err);
      setHasCameraError(
        err?.message?.includes('Permission')
          ? 'Camera access permission denied. Please enable camera permissions in your browser settings.'
          : 'Unable to start camera. Please check camera connection or reload.',
      );
      setScannerReady(false);
    }
  }, [facingMode, handleScanSuccess]);

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, [startScanner]);

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.debug('Torch toggle failed', e);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* Scanner Video Mount */}
      <div id={containerId} className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

      {/* Holographic Viewfinder Overlay */}
      {scannerReady && !hasCameraError && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Dimmed surrounding frame mask */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
            {/* Viewfinder Glowing Corners */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#D4A24C] rounded-tl-2xl shadow-[0_0_12px_rgba(212,162,76,0.8)]" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#D4A24C] rounded-tr-2xl shadow-[0_0_12px_rgba(212,162,76,0.8)]" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#D4A24C] rounded-bl-2xl shadow-[0_0_12px_rgba(212,162,76,0.8)]" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#D4A24C] rounded-br-2xl shadow-[0_0_12px_rgba(212,162,76,0.8)]" />

            {/* Sweeping Laser Animation Bar */}
            {!paused && (
              <div
                className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#D4A24C] to-transparent shadow-[0_0_15px_#D4A24C] animate-pulse"
                style={{
                  animation: 'scannerLaser 2.2s ease-in-out infinite alternate',
                }}
              />
            )}

            {/* Subtext */}
            <div className="absolute -bottom-10 left-0 right-0 text-center">
              <span className="text-[11px] font-bold text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                Align guest pass QR within frame
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {hasTorch && (
          <button
            onClick={toggleTorch}
            className={`p-3 rounded-2xl backdrop-blur-xl border transition-all shadow-lg active:scale-95 ${
              torchOn
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30'
                : 'bg-black/50 text-white/90 border-white/15 hover:bg-black/70'
            }`}
            title="Toggle Flashlight"
          >
            <Flashlight size={20} />
          </button>
        )}

        <button
          onClick={toggleCamera}
          className="p-3 rounded-2xl bg-black/50 text-white/90 border border-white/15 hover:bg-black/70 backdrop-blur-xl transition-all shadow-lg active:scale-95"
          title="Switch Camera"
        >
          <SwitchCamera size={20} />
        </button>
      </div>

      {/* Camera Error State */}
      {hasCameraError && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-base font-bold mb-2">Camera Unavailable</h3>
          <p className="text-xs text-white/70 max-w-xs mb-6 leading-relaxed">
            {hasCameraError}
          </p>
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A1F1F] text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <RefreshCw size={14} /> Retry Camera
          </button>
        </div>
      )}

      {/* CSS Animation Keyframe Injection */}
      <style>{`
        @keyframes scannerLaser {
          0% { top: 8%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 92%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
