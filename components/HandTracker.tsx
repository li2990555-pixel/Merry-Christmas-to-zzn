
import React, { useRef, useEffect } from 'react';
import { HandData } from '../types';

interface Props {
  onHandUpdate: (data: HandData | null) => void;
  onCameraReady: () => void;
}

const HandTracker: React.FC<Props> = ({ onHandUpdate, onCameraReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Access global MediaPipe from index.html
    const Hands = (window as any).Hands;
    const Camera = (window as any).Camera;
    const drawConnectors = (window as any).drawConnectors;
    const drawLandmarks = (window as any).drawLandmarks;
    const HAND_CONNECTIONS = (window as any).HAND_CONNECTIONS;

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;

      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw for visual feedback
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#D4AF37', lineWidth: 2 });
        drawLandmarks(ctx, landmarks, { color: '#9B2226', lineWidth: 1, radius: 2 });

        // Gesture Logic
        // Landmark indices:
        // 0: Wrist
        // 4: Thumb tip
        // 8: Index tip
        // 12: Middle tip
        // 16: Ring tip
        // 20: Pinky tip
        
        const fingerTips = [8, 12, 16, 20];
        const wrist = landmarks[0];
        
        // Check if fingers are curled (Fist)
        let totalDistance = 0;
        fingerTips.forEach(idx => {
          const tip = landmarks[idx];
          const dist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
          totalDistance += dist;
        });

        // Heuristic thresholds
        const avgDist = totalDistance / fingerTips.length;
        const isFist = avgDist < 0.2;
        const isOpen = avgDist > 0.35;

        onHandUpdate({
          isFist,
          isOpen,
          x: (landmarks[9].x - 0.5) * 2, // Normalized -1 to 1 based on center
          y: (landmarks[9].y - 0.5) * -2,
        });
      } else {
        onHandUpdate(null);
      }
      ctx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start().then(() => {
      onCameraReady();
    });

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover scale-x-[-1]" />
    </div>
  );
};

export default HandTracker;
