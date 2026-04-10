import { useRef, useState, useCallback } from "react";

interface BoundingBox {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface PersonLockState {
  isLocked: boolean;
  lockEnabled: boolean;
  personLost: boolean;
}

function getLandmarkBBox(landmarks: any[]): BoundingBox {
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  // Use torso + hip landmarks for stable bounding box
  const stableIndices = [11, 12, 23, 24, 0]; // shoulders, hips, nose
  for (const i of stableIndices) {
    const pt = landmarks[i];
    if (!pt || (pt.visibility ?? 0) < 0.4) continue;
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
  }
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

const MAX_DRIFT = 0.35; // normalized distance threshold
const LOST_FRAMES_THRESHOLD = 20;

export function usePersonLock() {
  const lockedBBox = useRef<BoundingBox | null>(null);
  const lostFrames = useRef(0);

  const [state, setState] = useState<PersonLockState>({
    isLocked: false,
    lockEnabled: true,
    personLost: false,
  });

  const lockPerson = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 33) return;
    lockedBBox.current = getLandmarkBBox(landmarks);
    lostFrames.current = 0;
    setState(s => ({ ...s, isLocked: true, personLost: false }));
  }, []);

  const unlock = useCallback(() => {
    lockedBBox.current = null;
    lostFrames.current = 0;
    setState(s => ({ ...s, isLocked: false, personLost: false }));
  }, []);

  const toggleLockEnabled = useCallback(() => {
    setState(s => {
      if (s.lockEnabled) {
        // Turning off — also unlock
        lockedBBox.current = null;
        lostFrames.current = 0;
        return { isLocked: false, lockEnabled: false, personLost: false };
      }
      return { ...s, lockEnabled: true };
    });
  }, []);

  // Returns true if this person matches the locked person (or lock is off)
  const validatePerson = useCallback((landmarks: any[] | null): boolean => {
    if (!state.lockEnabled || !lockedBBox.current || !landmarks || landmarks.length < 33) {
      return true;
    }

    const current = getLandmarkBBox(landmarks);
    const locked = lockedBBox.current;

    const dx = current.centerX - locked.centerX;
    const dy = current.centerY - locked.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_DRIFT) {
      lostFrames.current++;
      if (lostFrames.current >= LOST_FRAMES_THRESHOLD) {
        setState(s => ({ ...s, personLost: true }));
      }
      return false;
    }

    // Person found — update reference slowly (adaptive tracking)
    lostFrames.current = 0;
    lockedBBox.current = {
      centerX: locked.centerX * 0.85 + current.centerX * 0.15,
      centerY: locked.centerY * 0.85 + current.centerY * 0.15,
      width: locked.width * 0.85 + current.width * 0.15,
      height: locked.height * 0.85 + current.height * 0.15,
    };
    setState(s => s.personLost ? { ...s, personLost: false } : s);
    return true;
  }, [state.lockEnabled]);

  return {
    ...state,
    lockPerson,
    unlock,
    toggleLockEnabled,
    validatePerson,
  };
}
