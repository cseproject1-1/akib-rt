# 🌟 Routine Tracker (RT)

[![Trigger Cron Jobs](https://github.com/akibcse24/rt/actions/workflows/cron.yml/badge.svg?branch=main&event=schedule)](https://github.com/akibcse24/rt/actions/workflows/cron.yml)

**Premium routine tracking for peak performance. Build unbreakable discipline.**

![Routine Tracker](public/og-image.jpg)

## ✨ Features

### 📋 Task Management
- Create and manage daily tasks with time blocks
- Visual progress tracking for each day
- Recurring tasks with customizable schedules (Mon-Sun)
- Task completion history and streaks

### 🎯 Goal Setting
- Set personal and professional goals
- Track progress with deadlines
- Categorize by Fitness, Health, Career, Personal, Education

### 🤖 AI Assistant
- **Gemini AI** or **Groq (Llama 4)** integration
- Create tasks/goals via natural language
- Upload class schedule images for auto-import
- Daily motivational notifications
- Mark tasks complete via chat

### ⏱️ Focus Timer
- Pomodoro-style focus sessions
- Work, Short Break, and Long Break modes
- Beautiful animated timer display

### 📊 Analytics
- Task completion rates
- Streak tracking
- Performance insights

### 🏆 Gamification
- Score points for completing tasks
- Global leaderboard
- Achievement badges

### 🛒 Marketplace
- Download community templates
- Pre-built routines for different lifestyles
- 50+ templates available

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/routine-tracker.git
cd routine-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with:

```env
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI (Optional - for AI features)
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy!

```bash
# Or use CLI
npx vercel
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI | Google Gemini, Groq |
| Icons | Lucide React |
| Deployment | Vercel |

## 📁 Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── api/ai/         # AI API routes
│   ├── analytics/
│   ├── calendar/
│   ├── focus/
│   ├── goals/
│   ├── leaderboard/
│   └── marketplace/
├── components/
│   ├── ai/             # AI chat components
│   ├── achievements/
│   ├── focus/
│   ├── leaderboard/
│   └── ui/             # Reusable UI components
├── context/            # React contexts
│   ├── AuthContext
│   ├── TaskContext
│   ├── GoalContext
│   ├── AIContext
│   └── UIContext
├── data/               # Static data
└── lib/                # Utilities (Firebase, etc.)
```

## 🎨 Features by Page

| Page | Features |
|------|----------|
| `/` | Dashboard, Tasks, Progress |
| `/calendar` | Weekly calendar view |
| `/goals` | Goal management |
| `/focus` | Pomodoro timer |
| `/analytics` | Statistics & insights |
| `/leaderboard` | Rankings & badges |
| `/marketplace` | Template store |

## 📱 PWA Support

- Installable on mobile devices
- Offline capability
- Push notifications
- Home screen icon

## 🔒 Security

- Server-side API key handling
- Firebase security rules
- HTTPS enforced
- XSS protection headers

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

**Built with ❤️ for productivity enthusiasts**
