"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";

type CameraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  isUploading?: boolean;
};

export default function CameraModal({ isOpen, onClose, onCapture, isUploading = false }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsCameraReady(false);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const handlePlaying = () => {
      setIsCameraReady(true);
    };

    const handleLoadedMetadata = () => {
      // Also check if video is ready
      if (video.readyState >= 2) {
        setIsCameraReady(true);
      }
    };

    const handleError = () => {
      setIsCameraReady(false);
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);

    // If video is already playing, set ready immediately
    if (video.readyState >= 2) {
      setIsCameraReady(true);
    }

    return () => {
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
            });
          }
        };
      }
    } catch (err: any) {
      setError(err.message || "Failed to access camera");
      console.error("Camera error:", err);
      setIsCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob, then to File
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "student-picture.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          onCapture(file);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10">
          <h2 className="text-xl font-semibold text-foreground">Take your photo for attendance</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-full hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[70vh] object-contain"
          />
          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center p-6">
                <p className="text-red-400 text-lg font-semibold mb-2">⚠️ Camera Error</p>
                <p className="text-white/80">{error}</p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!error && !isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div className="animate-spin border-4 border-white/30 border-t-white rounded-full w-12 h-12 mx-auto mb-4"></div>
                <p className="text-white/80">Starting camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-white">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              disabled={isUploading || !isCameraReady || !!error}
              className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  Capture & Submit
                </>
              )}
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Make sure your face is clearly visible in the frame
          </p>
        </div>
      </div>
    </div>
  );
}

