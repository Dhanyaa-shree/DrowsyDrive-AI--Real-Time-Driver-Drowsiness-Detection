import { useState, useRef, useEffect } from "react";
import { UploadCloud, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { predictFile } from "../api/client";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Eye landmarks
const LEFT_UPPER  = 159;
const LEFT_LOWER  = 145;
const LEFT_OUTER  = 33;
const LEFT_INNER  = 133;
const RIGHT_UPPER = 386;
const RIGHT_LOWER = 374;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;

// Mouth landmarks
const MOUTH_TOP    = 13;
const MOUTH_BOTTOM = 14;
const MOUTH_LEFT   = 78;
const MOUTH_RIGHT  = 308;

// Thresholds
const EAR_CLOSED = 0.18;    // eye closed below this
const MAR_YAWN   = 0.40;    // yawning above this

let landmarker = null;

async function initLandmarker() {
  if (landmarker) return;
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
  return dist(lm, upper, lower, img) / Math.max(dist(lm, outer, inner, img), 1);
}

function mouthAspectRatio(lm, img) {
  return dist(lm, MOUTH_TOP, MOUTH_BOTTOM, img) /
         Math.max(dist(lm, MOUTH_LEFT, MOUTH_RIGHT, img), 1);
}

export default function UploadAnalyze() {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const fileRef = useRef();

  useEffect(() => { initLandmarker().then(() => setReady(true)); }, []);

  const handle = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setResult(null);
    setLoading(true);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(res => { img.onload = res; });

      const det = landmarker.detect(img);

      // ---------- Face detected → use landmarks ----------
      if (det.faceLandmarks?.length) {
        const lm = det.faceLandmarks[0];
        const faceWidth  = Math.abs(lm[234].x - lm[454].x);
        const faceHeight = Math.abs(lm[10].y  - lm[152].y);

        if (faceWidth > 0.08 && faceHeight > 0.08) {
          const leftEAR  = eyeAspectRatio(lm, img, LEFT_UPPER,  LEFT_LOWER,  LEFT_OUTER,  LEFT_INNER);
          const rightEAR = eyeAspectRatio(lm, img, RIGHT_UPPER, RIGHT_LOWER, RIGHT_OUTER, RIGHT_INNER);
          const avgEAR   = (leftEAR + rightEAR) / 2;
          const mar      = mouthAspectRatio(lm, img);

          const eyeClass   = avgEAR < EAR_CLOSED ? "Closed" : "Open";
          const mouthClass = mar > MAR_YAWN ? "yawn" : "no_yawn";

          let stage = 0, label = "Alert";
          if (eyeClass === "Closed") { stage = 2; label = "Severe Fatigue"; }
          else if (mouthClass === "yawn") { stage = 1; label = "Mild Fatigue"; }

          setResult({
            mode: "face",
            eyeClass, mouthClass,
            fatigue_stage: stage,
            fatigue_label: label
          });
          setLoading(false);
          return;
        }
      }

      // ---------- Fallback: model for crops ----------
      const pred = await predictFile(file);
      const rawClass = pred.class;

      let eyeClass = "N/A", mouthClass = "N/A";
      let stage = 0, label = "Alert";

      if (rawClass === "Open" || rawClass === "Closed") {
        eyeClass = rawClass;
        if (eyeClass === "Closed") { stage = 2; label = "Severe Fatigue"; }
      } else if (rawClass === "yawn" || rawClass === "no_yawn") {
        mouthClass = rawClass;
        if (mouthClass === "yawn") { stage = 1; label = "Mild Fatigue"; }
      }

      setResult({
        mode: "crop",
        eyeClass, mouthClass,
        fatigue_stage: stage,
        fatigue_label: label,
        rawClass,
        confidence: pred.confidence
      });
    } catch (e) {
      console.error(e);
      setResult({ error: "Analysis failed." });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null); setResult(null); setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const stageBg = {
    0: "bg-green-50 text-green-700 border-green-200",
    1: "bg-orange-50 text-orange-700 border-orange-200",
    2: "bg-red-50 text-red-700 border-red-200"
  };

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Upload & Analyze</div>

      {!preview && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-accent transition"
        >
          <UploadCloud className="mx-auto text-accent" size={40} />
          <div className="mt-3 text-sm text-slate-600">Drag & drop image or</div>
          <div className="mt-3 inline-block bg-accent text-white text-sm px-5 py-2 rounded-lg">
            Choose File
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Full face or eye / mouth crop image
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
                 onChange={(e) => handle(e.target.files[0])} />
        </div>
      )}

      {preview && (
        <div className="relative">
          <div className="bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center"
               style={{ minHeight: "260px", maxHeight: "360px" }}>
            <img src={preview} alt="preview"
                 className="w-full h-auto max-h-[360px] object-contain" />
          </div>
          <button onClick={reset}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow">
            <X size={16} />
          </button>
          <div className="text-xs text-slate-500 mt-1 truncate">{fileName}</div>
        </div>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Analyzing...
        </div>
      )}

      {result && !loading && !result.error && (
        <div className="mt-3 bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          {result.mode === "face" ? (
            <>
              <Row label="Eye State" value={result.eyeClass} />
              <Row label="Mouth State" value={result.mouthClass} />
            </>
          ) : (
            <>
              {result.eyeClass !== "N/A" && (
                <Row label="Eye State" value={result.eyeClass} />
              )}
              {result.mouthClass !== "N/A" && (
                <Row label="Mouth State" value={result.mouthClass} />
              )}
              <Row label="Model Class" value={result.rawClass} />
              <Row label="Confidence" value={result.confidence.toFixed(3)} />
            </>
          )}
          <Row label="Fatigue" value={`${result.fatigue_label} (${result.fatigue_stage})`} />

          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border ${stageBg[result.fatigue_stage]}`}>
            {result.fatigue_stage === 0 ? (
              <><CheckCircle2 size={16} /><span>Driver is alert</span></>
            ) : result.fatigue_stage === 1 ? (
              <><AlertTriangle size={16} /><span>Mild fatigue detected</span></>
            ) : (
              <><AlertTriangle size={16} /><span>Severe fatigue — take a break</span></>
            )}
          </div>

          <button onClick={reset}
                  className="mt-3 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium">
            Upload Another
          </button>
        </div>
      )}

      {result?.error && (
        <div className="mt-3 bg-red-50 text-red-700 text-sm rounded-xl p-3">
          {result.error}
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