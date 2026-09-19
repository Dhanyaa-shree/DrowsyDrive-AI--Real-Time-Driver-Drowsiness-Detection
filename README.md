# 🛡️ DrowsyDrive AI

### Safer Roads, Smarter AI

**Real-Time Driver Drowsiness Detection using Deep Learning and Computer Vision**

DrowsyDrive AI is a vision-based driver monitoring system that detects potential driver fatigue using **eye closure and yawning analysis**. The system combines **PyTorch, MobileNetV2, MediaPipe FaceLandmarker, Flask, and React** to provide real-time fatigue detection through a web dashboard.

> **Detect Early. Prevent Accidents.**

---

## 🚀 Key Features

* 👁️ Eye-state detection — Open / Closed
* 🥱 Yawning detection — Yawn / No Yawn
* 🧠 Custom CNN and MobileNetV2 comparison
* 🔄 MobileNetV2 **Frozen Base & Fine-Tuned** experiments
* 📹 Real-time webcam detection
* 🖼️ Image upload analysis
* 📊 Fatigue progression visualization
* 🔌 REST API with Flask
* 💻 React-based interactive dashboard
* 🎯 Three-level fatigue classification

### Fatigue Classification

| Detection      | Fatigue Level     |
| -------------- | ----------------- |
| Open / No Yawn | 🟢 Alert          |
| Yawn           | 🟡 Mild Fatigue   |
| Closed Eyes    | 🔴 Severe Fatigue |

---

## 📊 Dataset

**2,900 images across 4 classes**

| Class     |    Images |
| --------- | --------: |
| Closed    |       726 |
| Open      |       726 |
| no_yawn   |       725 |
| yawn      |       723 |
| **Total** | **2,900** |

**Data Split:** 70% Training · 15% Validation · 15% Testing

### Preprocessing

* Image size: **224 × 224**
* Pixel normalization: **[0, 1]**
* Rotation: **±15°**
* Zoom/Crop: **85–100%**
* Brightness augmentation: **±20%**
* Horizontal flip

---

## 🧠 Models Evaluated

Three model configurations were implemented and evaluated:

### 1. Custom CNN

A convolutional neural network trained from scratch and used as the baseline.

### 2. MobileNetV2 — Frozen Base

ImageNet-pretrained MobileNetV2 with the pretrained feature extractor **frozen** while training the classification head.

### 3. MobileNetV2 — Fine-Tuned

The pretrained MobileNetV2 model with selected layers **unfrozen and fine-tuned** using a lower learning rate.

### 📈 Results

| Model                        | Validation Accuracy | Test Accuracy |
| ---------------------------- | ------------------: | ------------: |
| Custom CNN                   |              81.02% |    **85.42%** |
| MobileNetV2 — Frozen Base    |          **93.75%** |             — |
| **MobileNetV2 — Fine-Tuned** |          **97.92%** |    **97.27%** |

The fine-tuned MobileNetV2 achieved **97.27% test accuracy**, an **11.85 percentage-point improvement** over the Custom CNN.

---

## 🛠️ Tech Stack

| Component         | Technology                  |
| ----------------- | --------------------------- |
| Deep Learning     | PyTorch, TorchVision        |
| Models            | Custom CNN, MobileNetV2     |
| Computer Vision   | OpenCV, MediaPipe           |
| Backend           | Flask, Flask-CORS           |
| Frontend          | React, Vite, TailwindCSS    |
| Visualization     | Recharts                    |
| Data & Evaluation | NumPy, Pandas, scikit-learn |
| Development       | Jupyter / Google Colab      |

---

## 📂 Project Structure

```text
DrowsyDrive-AI/
├── backend/
│   ├── app.py
│   ├── model_loader.py
│   ├── inference.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── Models/
│   ├── mobilenetv2_fatigue.pth
│   └── classes.json
│
├── Notebook/
│   └── fatigue_detection.ipynb
│
└── README.md
```

---

## 🔌 REST API

| Endpoint             | Method | Purpose                 |
| -------------------- | ------ | ----------------------- |
| `/api/health`        | GET    | Backend health check    |
| `/api/predict`       | POST   | Image prediction        |
| `/api/predict_frame` | POST   | Webcam frame prediction |
| `/api/stats`         | GET    | Session statistics      |

---

## ⚡ Getting Started

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```

Backend:

```text
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## 📁 Trained Model

```text
Models/
├── mobilenetv2_fatigue.pth
└── classes.json
```

`mobilenetv2_fatigue.pth` contains the **fine-tuned MobileNetV2 weights** used for final inference.

---

<p align="center"> <strong>🛡️ DrowsyDrive AI</strong><br> <em>Safer Roads, Smarter AI</em><br><br> <strong>Detect Early. Prevent Accidents.</strong><br><br> Made with ❤️ using PyTorch, React & Computer Vision </p>
