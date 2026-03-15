import { useRef, useState, useCallback, useEffect } from "react";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export interface PoseState {
  isModelLoaded: boolean;
  isWebcamActive: boolean;
  landmarks: any[] | null;
  fps: number;
  error: string | null;
}

function calcAngle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function getJointAngles(landmarks: any[]) {
  if (!landmarks || landmarks.length < 33) return null;
  return {
    leftKnee: calcAngle(landmarks[23], landmarks[25], landmarks[27]),
    rightKnee: calcAngle(landmarks[24], landmarks[26], landmarks[28]),
    leftElbow: calcAngle(landmarks[11], landmarks[13], landmarks[15]),
    rightElbow: calcAngle(landmarks[12], landmarks[14], landmarks[16]),
    leftHip: calcAngle(landmarks[11], landmarks[23], landmarks[25]),
    rightHip: calcAngle(landmarks[12], landmarks[24], landmarks[26]),
    leftShoulder: calcAngle(landmarks[13], landmarks[11], landmarks[23]),
    rightShoulder: calcAngle(landmarks[14], landmarks[12], landmarks[24]),
  };
}

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export function usePoseDetection(canvasRef: React.RefObject<HTMLCanvasElement>, videoRef: React.RefObject<HTMLVideoElement>) {
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const fpsCountRef = useRef(0);

  const [state, setState] = useState<PoseState>({
    isModelLoaded: false,
    isWebcamActive: false,
    landmarks: null,
    fps: 0,
    error: null,
  });

  const loadModel = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      poseLandmarkerRef.current = landmarker;
      setState(s => ({ ...s, isModelLoaded: true }));
    } catch (err: any) {
      setState(s => ({ ...s, error: `Model load failed: ${err.message}` }));
    }
  }, []);

  const startWebcam = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setState(s => ({ ...s, isWebcamActive: true, error: null }));
    } catch (err: any) {
      setState(s => ({ ...s, error: `Webcam error: ${err.message}` }));
    }
  }, [videoRef]);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setState(s => ({ ...s, isWebcamActive: false, landmarks: null }));
  }, [videoRef]);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const now = performance.now();
    fpsCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setState(s => ({ ...s, fps: fpsCountRef.current }));
      fpsCountRef.current = 0;
      lastTimeRef.current = now;
    }

    const result = landmarker.detectForVideo(video, now);
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];
      setState(s => ({ ...s, landmarks: lm }));

      // Draw skeleton
      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawLandmarks(lm, {
        radius: 4,
        color: "hsl(153, 100%, 50%)",
        fillColor: "hsl(153, 100%, 50%)",
      });
      drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
        color: "hsl(217, 91%, 60%)",
        lineWidth: 3,
      });

      // Draw angle labels
      const angles = getJointAngles(lm);
      if (angles) {
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "hsl(153, 100%, 50%)";
        const drawAngle = (idx: number, angle: number, label: string) => {
          const pt = lm[idx];
          ctx.fillText(`${label}: ${Math.round(angle)}°`, pt.x * canvas.width + 8, pt.y * canvas.height - 4);
        };
        drawAngle(25, angles.leftKnee, "L.Knee");
        drawAngle(26, angles.rightKnee, "R.Knee");
        drawAngle(13, angles.leftElbow, "L.Elbow");
        drawAngle(14, angles.rightElbow, "R.Elbow");
      }
    } else {
      setState(s => ({ ...s, landmarks: null }));
    }

    // Overlay info
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "rgba(0,255,136,0.9)";
    ctx.fillText(`BLAZEPOSE  |  33 KEYPOINTS  |  FPS: ${state.fps}`, 12, 22);

    animFrameRef.current = requestAnimationFrame(detectFrame);
  }, [canvasRef, videoRef, state.fps]);

  // Start detection loop when webcam is active
  useEffect(() => {
    if (state.isWebcamActive && state.isModelLoaded) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state.isWebcamActive, state.isModelLoaded, detectFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      poseLandmarkerRef.current?.close();
    };
  }, [stopWebcam]);

  return { ...state, loadModel, startWebcam, stopWebcam };
}
