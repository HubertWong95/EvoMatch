// src/features/webcam/WebcamCapture.tsx
import React, { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (dataUrl: string) => void;
};

export default function WebcamCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e: any) {
        setError(e?.message || "Unable to access camera");
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/png");
    onCapture(dataUrl);
  };

  return (
    <div className="space-y-2">
      {error ? (
        <div className="rounded-md border-2 border-red-700 bg-red-100 p-2 font-pixel text-sm text-red-700">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-64 w-80 rounded-md border-4 border-black bg-black object-cover"
        />
      )}
      <div className="flex justify-center">
        <button
          onClick={snap}
          className="rounded-md border-4 border-black bg-game-yellow px-4 py-2 font-pixel shadow hover:translate-y-0.5"
        >
          Capture
        </button>
      </div>
    </div>
  );
}
