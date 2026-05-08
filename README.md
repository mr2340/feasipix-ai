# FeasiPix AI - Advanced AI Photo Editor

![FeasiPix Banner](https://img.shields.io/badge/FeasiPix-AI_Photo_Editor-6366f1?style=for-the-badge&logo=adobe-photoshop&logoColor=white)

FeasiPix AI is a cutting-edge, web-based photo editing platform that leverages the power of Google's Gemini AI to provide professional-grade image transformations through simple natural language prompts. Whether you're looking to change a background, swap outfits, or generate creative assets, FeasiPix makes it effortless while preserving the natural look of your subjects.

## ✨ Key Features

- **🪄 Magic AI Editing**: Transform photos by simply describing what you want (e.g., "Change the background to a snowy mountain" or "Give me a blue suit").
- **🛡️ Face Preservation**: Our advanced AI ensures that facial features and skin tones remain authentic and untouched during transformations.
- **🚀 Quick Enhance**: One-click professional retouching and enhancement for instant quality improvement.
- **🎨 Creative Toolbox**:
  - **Sticker & Mascot Generator**: Create custom branding assets.
  - **Background Remover**: Clean, precise cutouts in seconds.
  - **Face Swap & Age Journey**: Fun and powerful portrait manipulations.
  - **QR Code & Logo Generator**: Functional creative tools for professionals.
- **📱 Responsive Design**: A premium, dark-mode-ready interface that works seamlessly across desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS for a sleek, modern UI
- **AI Engine**: Google Gemini AI (@google/genai)
- **Backend & Auth**: Supabase (PostgreSQL, Authentication)
- **Image Processing**: react-image-crop, react-compare-image
- **Bundler**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API Key
- A Supabase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/feasipix-ai.git
   cd feasipix-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your keys (refer to `.env.example`):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🔒 Security & Best Practices

- **API Security**: Environment variables are managed via `.env` and excluded from version control to protect sensitive keys.
- **Type Safety**: Built with TypeScript to ensure robust code and catch errors early.
- **Authentication**: Secure user management provided by Supabase Auth.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by [GHD codes](https://github.com/your-username)**
