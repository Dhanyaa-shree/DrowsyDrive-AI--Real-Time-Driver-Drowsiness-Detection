import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// -------- Eye landmarks --------
const LEFT_EYE_VIS  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_VIS = [362, 385, 387, 263, 373, 380];

// Eyelid margin landmarks (correct for closure detection)
const LEFT_UPPER  = 159;
const LEFT_LOWER  = 145;
const LEFT_OUTER  = 33;
const LEFT_INNER  = 133;

const RIGHT_UPPER = 386;
const RIGHT_LOWER = 374;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;

// Mouth landmarks
const MOUTH_VIS    = [61, 291, 13, 14, 78, 308];
const MOUTH_TOP    = 13;
const MOUTH_BOTTOM = 14;
const MOUTH_LEFT   = 78;
const MOUTH_RIGHT  = 308;

// MAR thresholds
const MAR_OPEN   = 0.35;
const MAR_CLOSED = 0.10;

// Adaptive EAR
const EAR_ABS_MIN       = 0.10;
const EAR_BASELINE_INIT = 0.32;
const EAR_CLOSED_RATIO  = 0.70;
const EAR_OPEN_RATIO    = 0.85;

let landmarker = null;
let baselineEAR = EAR_BASELINE_INIT;

async function initLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    },
    runningMode: "IMAGE",
    numFaces: 1
  });
}

function dist(lm, i, j, img) {
  const dx = (lm[i].x - lm[j].x) * img.width;
  const dy = (lm[i].y - lm[j].y) * img.height;
  return Math.sqrt(dx * dx + dy * dy);
}

function eyeAspectRatio(lm, img, upper, lower, outer, inner) {
  const v = dist(lm, upper, lower, img);
  const h = dist(lm, outer, inner, img);
  return v / Math.max(h, 1);
}

function mouthAspectRatio(lm, img) {
  const v = dist(lm, MOUTH_TOP, MOUTH_BOTTOM, img);
  const h = dist(lm, MOUTH_LEFT, MOUTH_RIGHT, img);
  return v / Math.max(h, 1);
}

function decideEye(ear) {
  if (ear < EAR_ABS_MIN) return "Closed";
  if (ear > baselineEAR * EAR_OPEN_RATIO) {
    baselineEAR = baselineEAR * 0.9 + ear * 0.1;
  }
  const ratio = ear / baselineEAR;
  if (ratio < EAR_CLOSED_RATIO) return "Closed";
  return "Open";
}

function decideMouth(mar) {
  if (mar > MAR_OPEN)   return "yawn";
  if (mar < MAR_CLOSED) return "no_yawn";
  return "no_yawn";
}

export default function LiveDetection() {
  const webcamRef = useRef(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initLandmarker().then(() => setReady(true)).catch(console.error);
  }, []);

  const releaseWebcam = () => {
    const video = webcamRef.current?.video;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  };

  const stopAll = () => {
    setRunning(false);
    setResult(null);
    releaseWebcam();
    baselineEAR = EAR_BASELINE_INIT;
  };

  useEffect(() => () => releaseWebcam(), []);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape" && running) stopAll(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [running]);

  useEffect(() => {
    if (!running || !ready) return;

    const id = setInterval(() => {
      const shot = webcamRef.current?.getScreenshot();
      if (!shot) return;

      const img = new Image();
      img.onload = () => {
        try {
          const det = landmarker.detect(img);
          if (!det.faceLandmarks?.length) return;

          const lm = det.faceLandmarks[0];

          const faceWidth  = Math.abs(lm[234].x - lm[454].x);
          const faceHeight = Math.abs(lm[10].y  - lm[152].y);
          if (faceWidth < 0.15 || faceHeight < 0.15) return;

          const leftEAR  = eyeAspectRatio(lm, img, LEFT_UPPER,  LEFT_LOWER,  LEFT_OUTER,  LEFT_INNER);
          const rightEAR = eyeAspectRatio(lm, img, RIGHT_UPPER, RIGHT_LOWER, RIGHT_OUTER, RIGHT_INNER);
          const avgEAR   = (leftEAR + rightEAR) / 2;

          const mar = mouthAspectRatio(lm, img);

          if (avgEAR < 0.02 || avgEAR > 0.60) return;

          const eyeClass   = decideEye(avgEAR);
          const mouthClass = decideMouth(mar);

          let stage = 0, label = "Alert";
          if (eyeClass === "Closed") { stage = 2; label = "Severe Fatigue"; }
          else if (mouthClass === "yawn") { stage = 1; label = "Mild Fatigue"; }

          setResult({
            eyeClass, mouthClass,
            fatigue_stage: stage,
            fatigue_label: label,
            ear: avgEAR,
            mar,
            baseline: baselineEAR,
            lm, imgW: img.width, imgH: img.height,
            noFace: false
          });
        } catch (err) {
          console.error(err);
        }
      };
      img.src = shot;
    }, 400);

    return () => clearInterval(id);
  }, [running, ready]);

  const stageBg = {
    0: "bg-green-50 text-green-700 border-green-200",
    1: "bg-orange-50 text-orange-700 border-orange-200",
    2: "bg-red-50 text-red-700 border-red-200"
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold flex items-center gap-2">
          <Eye size={18} /> Live Detection (Webcam)
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          running ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
        }`}>
          {running ? "● Live" : "○ Idle"}
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-black h-64">
        {running ? (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Camera off
          </div>
        )}

        {result && running && result.lm && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none"
               viewBox={`0 0 ${result.imgW} ${result.imgH}`}
               preserveAspectRatio="none">
            {LEFT_EYE_VIS.map(i => (
              <circle key={`l${i}`} cx={result.lm[i].x * result.imgW}
                      cy={result.lm[i].y * result.imgH} r="3" fill="red" />
            ))}
            {RIGHT_EYE_VIS.map(i => (
              <circle key={`r${i}`} cx={result.lm[i].x * result.imgW}
                      cy={result.lm[i].y * result.imgH} r="3" fill="dodgerblue" />
            ))}
            {MOUTH_VIS.map(i => (
              <circle key={`m${i}`} cx={result.lm[i].x * result.imgW}
                      cy={result.lm[i].y * result.imgH} r="3" fill="lime" />
            ))}
            <circle cx={result.lm[LEFT_UPPER].x * result.imgW}
                    cy={result.lm[LEFT_UPPER].y * result.imgH} r="4" fill="yellow" />
            <circle cx={result.lm[LEFT_LOWER].x * result.imgW}
                    cy={result.lm[LEFT_LOWER].y * result.imgH} r="4" fill="yellow" />
            <circle cx={result.lm[RIGHT_UPPER].x * result.imgW}
                    cy={result.lm[RIGHT_UPPER].y * result.imgH} r="4" fill="yellow" />
            <circle cx={result.lm[RIGHT_LOWER].x * result.imgW}
                    cy={result.lm[RIGHT_LOWER].y * result.imgH} r="4" fill="yellow" />
          </svg>
        )}

        {result && running && !result.noFace && (
          <div className={`absolute top-3 right-3 px-3 py-2 rounded-lg border text-xs font-semibold ${stageBg[result.fatigue_stage]}`}>
            {result.fatigue_label}
          </div>
        )}
      </div>

      <button
        onClick={running ? stopAll : () => { baselineEAR = EAR_BASELINE_INIT; setRunning(true); }}
        disabled={!ready}
        className="mt-3 w-full bg-accent hover:bg-accent-light text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
      >
        {!ready ? "Loading detector..." : running ? "Stop Detection" : "Start Detection"}
      </button>

      {running && (
        <p className="text-xs text-slate-400 mt-2 text-center">
          Press <kbd className="px-1 border rounded">Esc</kbd> to stop
        </p>
      )}

      {result && running && (
        <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <Row label="Eye State" value={result.eyeClass} />
          <Row label="Mouth State" value={result.mouthClass} />
          <Row label="Fatigue Level" value={`${result.fatigue_label} (${result.fatigue_stage})`} />

          <div className="flex items-center gap-2 pt-2">
            {result.fatigue_stage === 0 ? (
              <><CheckCircle2 size={16} className="text-green-600" />
                <span className="text-green-700">No drowsiness detected</span></>
            ) : (
              <><AlertTriangle size={16} className="text-red-600" />
                <span className="text-red-700">Drowsiness detected — take a break</span></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}