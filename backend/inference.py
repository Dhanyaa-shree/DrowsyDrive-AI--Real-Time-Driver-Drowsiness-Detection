import io
import base64
import torch
import numpy as np
from PIL import Image
from torchvision import transforms
from model_loader import MODEL, CLASSES, IDX2STAGE, STAGE_LABELS, DEVICE

IMG_SIZE = 224

_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def _predict_pil(img: Image.Image):
    x = _tf(img.convert("RGB")).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        probs = torch.softmax(MODEL(x), dim=1)[0].cpu().numpy()
    idx = int(np.argmax(probs))
    stage = IDX2STAGE[idx]
    return {
        "class": CLASSES[idx],
        "fatigue_stage": stage,
        "fatigue_label": STAGE_LABELS[stage],
        "confidence": round(float(probs[idx]), 4),
        "all_probs": {CLASSES[i]: round(float(p), 4) for i, p in enumerate(probs)}
    }

def predict_from_bytes(data: bytes):
    return _predict_pil(Image.open(io.BytesIO(data)))

def predict_from_base64(b64: str):
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    return predict_from_bytes(data)