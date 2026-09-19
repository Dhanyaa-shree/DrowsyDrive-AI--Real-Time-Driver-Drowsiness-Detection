import json
import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Path to Models/ folder (one level up from backend/)
MODELS_DIR = Path(__file__).resolve().parent.parent / "Models"

def load_classes():
    with open(MODELS_DIR / "classes.json", "r") as f:
        return json.load(f)

def load_model():
    meta = load_classes()
    n_classes = len(meta["classes"])

    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(in_features, 128),
        nn.ReLU(inplace=True),
        nn.Dropout(0.5),
        nn.Linear(128, n_classes)
    )

    state = torch.load(MODELS_DIR / "mobilenetv2_fatigue.pth", map_location=DEVICE)
    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()
    return model, meta

MODEL, META = load_model()
CLASSES = META["classes"]
CLS2IDX = META["cls2idx"]
IDX2STAGE = {int(k): v for k, v in META["idx2stage"].items()}
STAGE_LABELS = META["stage_labels"]

print("Model loaded on", DEVICE)
print("Classes:", CLASSES)
print("Stage mapping:", IDX2STAGE)