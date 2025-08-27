// src/components/WebcamCapture.tsx
import { useRef, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 320,
  height: 320,
  facingMode: "user",
};

interface WebcamCaptureProps {
  onCapture: (imageDataUrl: string) => void;
}

const WebcamCapture = ({ onCapture }: WebcamCaptureProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCaptured(true);
      setImagePreview(imageSrc);
      onCapture(imageSrc);
    }
  };

  const resetCapture = () => {
    setCaptured(false);
    setImagePreview(null);
  };

  return (
    <div className="flex flex-col items-center">
      {!captured ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="rounded-lg border-2 border-black"
          />
          <button
            onClick={capture}
            className="mt-4 bg-game-green text-white px-4 py-2 rounded shadow-md font-pixel"
          >
            Capture Avatar
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <img
            src={imagePreview!}
            alt="Captured Avatar"
            className="w-32 h-32 object-cover rounded border-2 border-black mt-2"
          />
          <button
            onClick={resetCapture}
            className="mt-2 bg-game-blue text-white px-3 py-1 rounded shadow font-pixel"
          >
            Retake Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
