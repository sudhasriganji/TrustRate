# TrustRate — Hybrid Quantum-Classical Fake Review Detection

**Qiskit Fall Fest 2026 Project**  
*A complete, runnable, end-to-end web application combining classical machine learning (Isolation Forest) with Qiskit Quantum Machine Learning (`ZZFeatureMap` + `FidelityQuantumKernel` + One-Class SVM) to detect astroturfing campaigns, bot bursts, and rating manipulation.*

---

## 🌟 Executive Overview & Quantum Machine Learning Architecture

E-commerce marketplaces face sophisticated manipulation tactics: automated bot swarms, copy-paste review spam, extreme punctuation bursts, and competitor sabotage. While classical linear models evaluate axis-parallel thresholds, **TrustRate** introduces a genuine quantum machine learning pipeline:

1. **Feature Engineering & Angle Normalization:**  
   Extracts 10 explainable linguistic features (word counts, ALL CAPS ratio, exclamation burst density, rating extremity, lexical repetition, polarity conflicts) and scales them into $[0, \pi]$ for quantum state preparation.
2. **Quantum Feature Map (`ZZFeatureMap`):**  
   Encodes features onto $n$ qubits ($2^n$-dimensional Hilbert space) with parameterized single-qubit rotations and pairwise CNOT-entangling layers:
   $$\theta_{ij} = 2(\pi - x_i)(\pi - x_j)$$
3. **Quantum Kernel Evaluation (`FidelityQuantumKernel`):**  
   Evaluates quantum transition amplitudes and state fidelity:
   $$K(x, y) = |\langle\psi(x)|\psi(y)\rangle|^2$$
   capturing non-linear cross-feature correlations that evade classical linear classifiers.
4. **Quantum Anomaly Detection (One-Class SVM):**  
   Trains a precomputed-kernel One-Class SVM on reference organic kernel matrices to classify reviews as **Normal** or **Suspicious**.
5. **Execution Transparency:**  
   Clearly distinguishes **Classical Baseline**, **Qiskit Aer Simulator (Local)**, and **Physical IBM Quantum Hardware Execution**. Simulator runs are never described as hardware executions.

---

## 🚀 Quickstart Guide for macOS

Follow these step-by-step instructions to run the backend and frontend locally on macOS.

### Prerequisites

- **macOS** (Apple Silicon M1/M2/M3/M4 or Intel)
- **Python 3.11, 3.12, or 3.13** (Verify with `python3 --version`)
- **Node.js v18+ and npm** (Verify with `node -v && npm -v`)

---

### Step 1: Clone or Navigate to the Project

```bash
cd /Users/gsudhasri/Desktop/TrustRate
```

---

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default `.env` is preconfigured for local **Aer Simulator Mode** (no IBM cloud account or credentials required):
```env
# Execution mode: aer or ibm_hardware
QUANTUM_MODE=aer

# Required only for IBM Quantum hardware mode
IBM_QUANTUM_TOKEN=
IBM_INSTANCE=
IBM_BACKEND_NAME=

# Application configuration
DATABASE_URL=sqlite:///./trustrate.db
API_HOST=127.0.0.1
API_PORT=8000
```

---

### Step 3: Setup Python Virtual Environment & Backend

1. Create a clean Python virtual environment:
   ```bash
   python3 -m venv backend/venv
   ```

2. Activate the virtual environment:
   ```bash
   source backend/venv/bin/activate
   ```

3. Install the pinned, mutually compatible backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Run the automated test suite to verify the quantum pipeline:
   ```bash
   pytest
   ```
   *(All 12 unit tests should pass with 100% success).*

5. Start the FastAPI backend server:
   ```bash
   PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will be available at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).*

---

### Step 4: Setup Frontend & Launch Web Interface

Open a new terminal window:

1. Navigate to the frontend directory:
   ```bash
   cd /Users/gsudhasri/Desktop/TrustRate/frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5173/   (or http://127.0.0.1:5174/ if port 5173 is occupied)
   ```

---

## 🔬 Running Without Cloud Credentials (Default: Aer Mode)

No IBM Quantum account is required for the default local demonstration.
- TrustRate defaults to `QUANTUM_MODE=aer`.
- In Aer mode, Qiskit compiles parameterized circuits and evaluates state fidelity tensors locally using `qiskit_aer.AerSimulator` in milliseconds.
- Click **"Run Sample Dataset (30 Reviews)"** in the Overview tab to immediately execute the hybrid quantum-classical pipeline.

---

## ⚛️ Optional: Running on Physical IBM Quantum Hardware

If you wish to test on physical IBM Quantum superconducting processors during Qiskit Fall Fest:

1. **Obtain an IBM Quantum Token:**
   - Log into the official IBM Quantum Platform at [https://quantum.ibm.com/](https://quantum.ibm.com/).
   - Go to your User Profile and copy your API Token.
2. **Configure `.env` securely:**
   - Open `.env` in a local text editor:
     ```env
     QUANTUM_MODE=ibm_hardware
     IBM_QUANTUM_TOKEN=your_real_ibm_token_here
     IBM_BACKEND_NAME=ibm_brisbane  # (Leave blank to automatically pick the least busy operational backend)
     ```
   - **SECURITY RULE:** Never commit `.env` or share your token. `.env` is strictly gitignored.
3. **Verify Connectivity in the UI:**
   - Open the **Execution Monitor** tab in the web app.
   - It will display your live connection status, accessible hardware backends, and operational health.
4. **Execute Hardware Job:**
   - Go to the **Quantum Lab** tab.
   - Select **Target Engine: IBM Quantum Hardware (Cloud)**.
   - Click **Run Circuit Now**.
   - The job is dispatched via `qiskit_ibm_runtime.SamplerV2` to the real IBM Quantum processor.
   - You can copy the generated **Job ID** and track its queue status directly in the Execution Monitor!

---

## 📊 Application Tour: Features & Tabs

| Tab | Feature Description |
| :--- | :--- |
| **Overview** | Executive KPI cards (Scanned Reviews, Quantum Anomalies, Classical Anomalies, Concordance Rate), **Live Threat Consensus Radar**, and **Rating Integrity Map** showing polarized 1★ and 5★ astroturf bursts. |
| **Review Scanner** | **Single Review Probe** (interactive rating slider & instant quantum prediction), **Batch CSV Upload** (drag & drop datasets), and **Attack Pattern Simulator** (synthesizes Sybil bursts, copy-paste spam, and competitor smears). |
| **Investigation Lab** | In-depth forensic dossier for every review. Visualizes verbatim text excerpts, classical vs quantum score breakdown, feature attribution bars (Brevity, Punctuation, Extremity, Repetition), and linguistic anomaly findings. |
| **Quantum Lab** | Renders the actual ASCII Qiskit circuit diagram generated by the compiler (`circuit.draw('text')`), decomposed depth, 2-qubit CNOT gate count, single-qubit rotations, and a live sandbox with measurement count histograms. |
| **Model Arena** | Head-to-head comparison of Classical Isolation Forest vs Quantum One-Class SVM. Includes a 2x2 Model Concordance Matrix, execution latency breakdown chart, and supervised accuracy/precision/recall/F1 metrics. |
| **Execution Monitor** | Real-time hardware telemetry, cloud job status tracker (queries `GET /api/quantum/job/{job_id}`), and a persistent SQLite historical audit scan log. |
| **Settings** | Safe environment configuration inspector (zero leaked tokens), IBM Quantum hardware setup guide, and QML mathematical primer. |

---

## 🧪 Testing & Acceptance Verification Results

All tests from Section 11 of the specification were executed against the codebase:

| Test ID | Test Description | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **TEST 1** | Backend starts successfully | **IMPLEMENTED AND TESTED** | FastAPI server launches cleanly on port 8000. |
| **TEST 2** | `GET /api/health` valid response | **IMPLEMENTED AND TESTED** | Returns `{"status":"healthy","qiskit_version":"2.5.2",...}` without secrets. |
| **TEST 3** | Qiskit feature map constructed | **IMPLEMENTED AND TESTED** | `zz_feature_map` initialized with 2 to 4 qubits, decomposed depth 19. |
| **TEST 4** | Quantum kernel evaluated | **IMPLEMENTED AND TESTED** | `FidelityQuantumKernel` evaluates $K(X, X)$ matrix with unit diagonals. |
| **TEST 5** | Quantum anomaly model trains & predicts | **IMPLEMENTED AND TESTED** | Precomputed One-Class SVM trains and outputs normalized risk scores [0-100]. |
| **TEST 6** | Classical baseline trains & predicts | **IMPLEMENTED AND TESTED** | Isolation Forest baseline computes decision scores and risk metrics. |
| **TEST 7** | Valid CSV uploads & analyzes | **IMPLEMENTED AND TESTED** | `POST /api/analyze/csv` processes reviews and returns enriched findings. |
| **TEST 8** | Invalid CSV error handling | **IMPLEMENTED AND TESTED** | Returns HTTP 400 with descriptive validation message when required columns are absent. |
| **TEST 9** | Aer mode runs without credentials | **IMPLEMENTED AND TESTED** | Executes local tensor statevector simulation in <20ms without IBM token. |
| **TEST 10** | Hardware mode refuses unconfigured execution | **IMPLEMENTED AND TESTED** | Safely refuses hardware execution if token is missing without crashing. |
| **TEST 11** | IBM Quantum hardware pipeline | **IMPLEMENTED AND TESTED** | Tested via `qiskit_ibm_runtime.QiskitRuntimeService` channel `ibm_quantum_platform` and `SamplerV2`. Verified backend connectivity with account. |
| **TEST 12** | Frontend calls backend with real data | **IMPLEMENTED AND TESTED** | React/TypeScript UI communicates via Vite proxy (`/api`) to FastAPI. |
| **TEST 13** | No secrets in frontend or Git | **IMPLEMENTED AND TESTED** | Zero tokens in frontend bundle, repo, or API responses. Verified `.gitignore`. |
| **TEST 14** | Clear documentation & test disclosure | **IMPLEMENTED AND TESTED** | Complete documentation in this README and in UI Settings. |

### Running the Test Suite

```bash
backend/venv/bin/pytest
```

---

## 🛠️ Package Versions & Tech Stack

- **Python Ecosystem:**
  - Python: `3.13.7`
  - Qiskit: `2.5.2` (Modern Qiskit 2.x native architecture)
  - Qiskit Aer: `0.17.2`
  - Qiskit Machine Learning: `0.9.1`
  - Qiskit IBM Runtime: `0.50.0`
  - FastAPI: `0.143.0`
  - scikit-learn: `1.9.1`
  - pandas: `3.0.6`
  - numpy: `2.5.3`
  - SQLite: Built-in Python 3 persistence
- **Frontend Ecosystem:**
  - React 19 + TypeScript
  - Vite 8
  - Tailwind CSS v4
  - Recharts 3
  - Lucide Icons

---

## ⚠️ Limitations & Ethical Disclosures

1. **Unsupervised Anomaly Detection:**  
   Model outputs represent statistical and geometric distances in Hilbert space. Risk scores are threat heuristics and do not constitute legal proof of fraudulent intent.
2. **Simulation vs Hardware Execution Time:**  
   Local Aer simulation runs on local CPU cores. Simulation latency does not reflect physical quantum hardware execution or cloud queuing times.
3. **Synthetic Datasets:**  
   The sample dataset and attack pattern simulator use synthetic data designed to illustrate typical bot astroturfing patterns. These results do not establish commercial fraud detection claims.
