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

export function usePoseDetection(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  videoRef: React.RefObject<HTMLVideoElement>
) {
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
      setState(s => ({ ...s, isModelLoaded: true, error: null }));
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
      try { videoRef.current.pause(); } catch {}
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    // Fully clear canvas + reset to placeholder dimensions
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 640;
      canvas.height = 480;
    }
    fpsCountRef.current = 0;
    lastTimeRef.current = 0;
    setState(s => ({ ...s, isWebcamActive: false, landmarks: null, fps: 0 }));
  }, [videoRef, canvasRef]);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    // FPS calculation
    const now = performance.now();
    fpsCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setState(s => ({ ...s, fps: fpsCountRef.current }));
      fpsCountRef.current = 0;
      lastTimeRef.current = now;
    }

    const result = landmarker.detectForVideo(video, now);
    const ctx = canvas.getContext("2d")!;

    // Critical: Sync canvas size with video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mirrored video (selfie view)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (result.landmarks && result.landmarks.length > 0) {
      let lm = result.landmarks[0];

      // Mirror landmarks to match flipped video
      const mirroredLm = lm.map((pt: any) => ({
        x: 1 - pt.x,
        y: pt.y,
        z: pt.z || 0,
        visibility: pt.visibility ?? 0,
      }));

      // Strong visibility check to prevent glitching
      const keyIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      const avgVisibility = keyIndices.reduce((sum, i) => sum + (mirroredLm[i]?.visibility ?? 0), 0) / keyIndices.length;

      const MIN_VISIBILITY = 0.58;

      if (avgVisibility > MIN_VISIBILITY) {
        setState(s => ({ ...s, landmarks: mirroredLm }));

        const drawingUtils = new DrawingUtils(ctx);

        // Draw clean stick figure
        drawingUtils.drawConnectors(
          mirroredLm,
          PoseLandmarker.POSE_CONNECTIONS,
          { color: "hsl(217, 91%, 60%)", lineWidth: 5 }
        );

        drawingUtils.drawLandmarks(mirroredLm, {
          radius: (landmark: any) => (landmark.visibility > 0.7 ? 6 : 3),
          color: "hsl(153, 100%, 50%)",
          fillColor: "hsl(153, 100%, 50%)",
        });

        // Highlight high-confidence joints
        ctx.fillStyle = "#ff00aa";
        mirroredLm.forEach((pt: any, i: number) => {
          if (pt.visibility > 0.75) {
            const px = pt.x * canvas.width;
            const py = pt.y * canvas.height;
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Draw angle labels (only when confident)
        const angles = getJointAngles(mirroredLm);
        if (angles) {
          ctx.font = "bold 12px monospace";
          ctx.fillStyle = "#00ffcc";
          const drawLabel = (idx: number, angle: number, label: string) => {
            const pt = mirroredLm[idx];
            if (pt.visibility > 0.6) {
              ctx.fillText(
                `${label} ${Math.round(angle)}°`,
                pt.x * canvas.width + 10,
                pt.y * canvas.height - 8
              );
            }
          };
          drawLabel(25, angles.leftKnee, "LK");
          drawLabel(26, angles.rightKnee, "RK");
          drawLabel(13, angles.leftElbow, "LE");
          drawLabel(14, angles.rightElbow, "RE");
        }
      } else {
        setState(s => ({ ...s, landmarks: null }));
      }
    } else {
      setState(s => ({ ...s, landmarks: null }));
    }

    // Overlay info
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "rgba(0, 255, 136, 0.9)";
    ctx.fillText(`BLAZEPOSE • 33 PTS • ${state.fps} FPS`, 15, 28);

    animFrameRef.current = requestAnimationFrame(detectFrame);
  }, [canvasRef, videoRef, state.fps]);

  // Start detection loop
  useEffect(() => {
    if (state.isWebcamActive && state.isModelLoaded) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state.isWebcamActive, state.isModelLoaded, detectFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopWebcam();
      poseLandmarkerRef.current?.close();
    };
  }, [stopWebcam]);

  return { ...state, loadModel, startWebcam, stopWebcam };
}
