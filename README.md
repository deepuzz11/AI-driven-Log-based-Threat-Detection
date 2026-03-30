# AI-Driven Log-Based Threat Detection

> A full-stack, real-time network threat detection platform powered by a hybrid Rule Engine + XGBoost ML pipeline, with a premium React dashboard and a live traffic simulator.

---

## Overview

This project is an end-to-end **Network Intrusion Detection System (NIDS)** that goes beyond model training. It combines:

- A **Self-Learning Hybrid Analyzer** — a regex-based rule engine with an XGBoost ML fallback that auto-generates new rules from novel attacks.
- A **FastAPI Server** serving analysis endpoints, live SSE streaming, and the frontend.
- A **React + Vite Dashboard** with glassmorphism UI, interactive charts, cluster visualization, and real-time traffic monitoring.
- A **Real-Time Log Generator** that simulates live network traffic at configurable event-per-second (EPS) rates.

All trained and evaluated on the **UNSW-NB15** benchmark dataset.

---

## Key Features

| Feature | Description |
|---|---|
| **Hybrid Detection** | Rule engine scans first; unmatched logs fall back to XGBoost ML classification |
| **Auto Rule Learning** | When the ML model detects a new attack, a regex rule is auto-generated and persisted |
| **Threat Clustering** | Attacks are grouped into semantic clusters (Active Exploitation, Stealth/Persistence, Generic Anomaly) |
| **Actionable Remediation** | Each attack category returns a tailored security remediation suggestion |
| **Live Traffic Stream** | SSE-based real-time log feed from a configurable traffic simulator |
| **Premium Dashboard** | Dark-themed React UI with glassmorphism, micro-animations, and interactive Chart.js visualizations |
| **Multi-Page App** | Dashboard, Analytics, Live Traffic, Reports, Integrations, and Settings pages |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React + Vite Frontend                       │
│  Dashboard │ Analytics │ Live Traffic │ Reports │ Settings      │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / SSE
┌──────────────────────────▼──────────────────────────────────────┐
│                      FastAPI Server                             │
│  /api/stats  /api/sample  /api/analyze  /api/stream  /api/add  │
└──────┬──────────────────────────┬───────────────────────────────┘
       │                          │
┌──────▼──────┐          ┌────────▼────────┐
│ Rule Engine │──miss──► │  XGBoost Model  │
│ (rules.txt) │◄──learn──│  (ML Fallback)  │
└─────────────┘          └─────────────────┘
       ▲
       │ live logs
┌──────┴──────────────────┐
│ Real-Time Log Generator │
│ (generate_logs.py)      │
└─────────────────────────┘
```

---

## Project Structure

```
AI-driven-Log-based-Threat-Detection/
│
├── api_server.py                    # FastAPI backend — REST API + SSE streaming + frontend serving
├── hybrid_log_analyzer.py           # Standalone hybrid analyzer (Rule → ML → Auto-learn)
├── rules.txt                        # Persisted regex rules (auto-learned + manually added)
│
├── hybrid_ml_model.joblib           # Serialized XGBoost model
├── label_encoder.joblib             # Label encoding mapping
│
├── main.ipynb                       # ML training & evaluation notebook
├── diff_group.ipynb                 # Grouped classification analysis notebook
├── dataset_dist.ipynb               # Dataset distribution analysis notebook
│
├── UNSW_NB15_training-set.csv       # Full training dataset
├── UNSW_NB15_testing-set.csv        # Full test dataset
├── UNSW_NB15_grouped_training_class.csv
├── UNSW_NB15_grouped_testing_class.csv
│
├── feature_importance_plots_main/   # Feature importance visualizations (main)
├── feature_importance_plots_diff_grp/ # Feature importance visualizations (grouped)
│
├── realtime_log_generator/
│   ├── generate_logs.py             # Simulates live network traffic at configurable EPS
│   └── realtime_traffic.log         # Live log output (consumed by SSE stream)
│
├── frontend/                        # React + Vite dashboard
│   ├── src/
│   │   ├── main.jsx                 # App entry point with React Router
│   │   ├── App.jsx                  # Root layout with sidebar navigation
│   │   ├── index.css                # Global styles (glassmorphism dark theme)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Overview — stats, charts, sample analysis
│   │   │   ├── Analytics.jsx        # Deep-dive analytics & visualizations
│   │   │   ├── LiveTraffic.jsx      # Real-time SSE traffic monitor
│   │   │   ├── Reports.jsx          # Exportable detection reports
│   │   │   ├── Integrations.jsx     # Third-party integration settings
│   │   │   └── Settings.jsx         # App configuration
│   │   └── components/
│   │       ├── ClusterCard.jsx      # Threat cluster visualization card
│   │       ├── ExplainPanel.jsx     # ML prediction explainability panel
│   │       ├── LogViewer.jsx        # Raw log line viewer
│   │       ├── PipelineTracker.jsx  # Detection pipeline step tracker
│   │       ├── RuleAddPanel.jsx     # Manual rule creation form
│   │       ├── SamplePicker.jsx     # Dataset sample selector
│   │       ├── StatsChart.jsx       # Chart.js-powered statistics
│   │       ├── SuggestPanel.jsx     # Remediation suggestion display
│   │       └── VerdictCard.jsx      # Attack/Benign verdict display
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt                 # Python dependencies
├── LICENSE
└── README.md
```

---

## Dataset

**UNSW-NB15** — Australian Centre for Cyber Security benchmark dataset:

- **257,673** network connection records
- **49** features capturing flow-level characteristics
- **10** attack categories: DoS, Backdoor, Analysis, Fuzzers, Worms, Shellcode, Reconnaissance, Generic, Exploits, Normal
- Real-world captures from the Cyber Range Lab at UNSW Canberra

---

## Models Evaluated

| Model | Accuracy | F1-Score | Status |
|---|---|---|---|
| **XGBoost** | 0.796 | Best | ✅ Deployed in production pipeline |
| **Random Forest** | 0.766 | Competitive | Evaluated |
| **Logistic Regression** | 0.683 | Lower | Evaluated |
| **LDA** | 0.681 | Baseline | Evaluated |

> Ensemble methods (XGBoost, Random Forest) significantly outperform linear approaches for multi-class network intrusion detection.

---

## Getting Started

### Prerequisites

- **Python** 3.9+
- **Node.js** 18+ & npm

### 1. Clone & Install Backend

```bash
git clone https://github.com/deepuzz11/AI-driven-Log-based-Threat-Detection.git
cd AI-driven-Log-based-Threat-Detection

pip install -r requirements.txt
```

### 2. Install & Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Start the API Server

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000
# OR you can just run: python api_server.py
```

The server starts on `http://localhost:8000` and serves both the API and the React frontend requests.

### 4. (Optional) Start the Real-Time Log Generator

In a separate terminal:

```bash
python realtime_log_generator/generate_logs.py --eps 2
```

| Flag | Default | Description |
|---|---|---|
| `--type` | `json` | Output format: `json`, `text`, or `api` |
| `--output` | `realtime_traffic.log` | File path or `stdout` |
| `--eps` | `2.0` | Events per second rate |
| `--api-url` | `http://localhost:8000/api/analyze` | API endpoint URL |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Dataset statistics & rule count |
| `GET` | `/api/sample/random?cat=ALL` | Random sample row (optionally by category) |
| `GET` | `/api/sample/<idx>` | Specific sample by index |
| `POST` | `/api/analyze` | Analyze a log row (hybrid rule + ML pipeline) |
| `GET` | `/api/stream` | SSE stream of real-time analyzed logs |
| `POST` | `/api/add-rule` | Add a custom detection rule |

### Example — Analyze a Log

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"row": {"dur": 1.0, "proto": "tcp", "service": "http", "sbytes": 5000}}'
```

**Response** includes: `prediction`, `decision`, `confidence`, `cluster`, `suggestion`, `feature_importance`, `class_probabilities`, and timing metrics.

---

## Detection Pipeline

```
Incoming Log
    │
    ▼
┌──────────────┐    match    ┌─────────────────┐
│  Rule Engine │───────────►│  ATTACK verdict  │
│ (regex scan) │             └─────────────────┘
└──────┬───────┘
       │ no match
       ▼
┌──────────────┐   attack    ┌─────────────────┐
│   XGBoost    │───────────►│  ATTACK verdict  │──► Auto-generate rule
│  ML Model    │             └─────────────────┘
└──────┬───────┘
       │ benign
       ▼
┌─────────────────┐
│  BENIGN verdict │
└─────────────────┘
```

1. **Rule Engine First** — Fast regex matching against `rules.txt`
2. **ML Fallback** — XGBoost classification with confidence scores & feature importance
3. **Auto Rule Learning** — Novel ML-detected attacks are converted into new regex rules for future instant detection
4. **Cluster & Remediate** — Attacks are grouped into threat clusters with actionable suggestions

---

## Frontend Pages

| Page | Description |
|---|---|
| **Dashboard** | Overview stats, attack/benign distribution, sample analysis with full pipeline visualization |
| **Analytics** | Deep-dive charts, class probability breakdowns, feature importance rankings |
| **Live Traffic** | Real-time SSE-powered traffic monitor with color-coded verdicts |
| **Reports** | Detection history and exportable report summaries |
| **Integrations** | Configuration for third-party security tool integrations |
| **Settings** | Application preferences and configuration |

---

## Performance Metrics

Models are evaluated using:
- **Accuracy** — Overall correct predictions
- **Precision & Recall** — Per-class performance
- **F1-Score** — Harmonic mean of precision/recall
- **Confusion Matrix** — Class-wise misclassification patterns
- **ROC-AUC** — Multi-class discrimination capability
- **Inference Time** — Sub-millisecond ML predictions

---

## Tech Stack

| Layer | Technology |
|---|---|
| **ML Model** | XGBoost, scikit-learn |
| **Backend** | FastAPI, Uvicorn, pandas, numpy |
| **Frontend** | React 19, Vite 7, React Router, Chart.js, Lucide Icons |
| **Streaming** | Server-Sent Events (SSE) |
| **Styling** | Vanilla CSS (glassmorphism dark theme) |

---

## MIT License

See [LICENSE](LICENSE) for details.

---

**Author**: [deepuzz11](https://github.com/deepuzz11)
**Dataset Reference**: UNSW-NB15 (Moustafa & Slay, 2015)
