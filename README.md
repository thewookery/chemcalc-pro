# ChemCalc Pro

**ChemCalc Pro** is a modern chemical and industrial batch calculation web suite built with Next.js 15, React 18, Tailwind CSS, shadcn/ui, and Google Genkit AI.

---

## 🧪 Features

- **16+ Scientific & Industrial Batch Calculators**:
  - Acid Value
  - Hydroxyl Value
  - Saponification Value
  - Iodine Value
  - Anionic Content Adjustment
  - Standard Dilution
  - Percentage Calculator
  - Caustic Trial & Batch Caustic Add
  - Short Batch Adjustment
  - Single & Multiple Components Excess Add
  - Soda Ash Trials
  - Standard Batch Component Breakdown & Standardization
  - Waste Stripping (Handwritten document OCR)
- **Real-time Live Calculation**: Instant output updates as you type.
- **Batch Presets & Local Storage**: Save frequent configurations locally.
- **Export & Documentation**: Export calculation results directly.
- **Light / Dark Mode**: Adaptive laboratory notebook theme.
- **AI Voice Assistant**: Voice commands powered by Gemini and Genkit.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (Node 24+ recommended)
- npm or yarn

### Installation

```bash
# Clone your repository
git clone https://github.com/<YOUR-USERNAME>/chemcalc-pro.git
cd chemcalc-pro

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## 🌐 Deploying to the Web

### Option A: Vercel (1-Click Deployment from GitHub - Recommended)
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Add `GEMINI_API_KEY` in the Environment Variables section (if using Genkit voice/OCR).
4. Click **Deploy**. Your app will be live at `https://<your-project>.vercel.app`.

### Option B: Firebase App Hosting
1. Connect this GitHub repository in the [Firebase Console](https://console.firebase.google.com).
2. Firebase will use the included `apphosting.yaml` to build and serve the Next.js application automatically on every git push.

---

## 🛠️ Workflows

Preconfigured agent workflows are located in `.agents/workflows/`:
- `build_project.md`: Installs dependencies, runs type checking, and builds the bundle.
- `preview_project.md`: Launches the local dev server on port 9002.
