# Focus Guard Cam - Video Proctoring System

A comprehensive video proctoring system that monitors candidate behavior during online interviews using computer vision and AI technologies.

## 🎯 Features

### Core Functionality

- **Real-time Video Monitoring** - Live camera feed with detection overlays
- **Focus Detection** - Monitors if candidate is looking at screen for >5 seconds
- **Face Detection** - Tracks face presence and multiple faces
- **Object Detection** - Identifies unauthorized items (phones, books, notes, devices)
- **Video Recording** - Records and stores interview sessions
- **Event Logging** - Real-time logging of all proctoring events
- **Integrity Scoring** - Calculates candidate integrity score based on violations

### Advanced Features

- **Audio Detection** - Monitors background noise and multiple voices
- **Real-time Alerts** - Instant notifications for violations
- **Professional UI** - Dark monitoring theme with status indicators
- **Session Management** - Start/stop interview sessions
- **Report Generation** - Comprehensive proctoring reports
- **Backend API** - RESTful API for data storage and retrieval

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)
- Modern web browser with camera access

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd focus-guard-cam
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies and setup MongoDB**

   ```bash
   cd backend
   ./setup.sh  # This creates .env file and installs dependencies
   ```

4. **Install and start MongoDB**

   **Option A: Local MongoDB**

   ```bash
   # macOS (using Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community

   # Ubuntu/Debian
   sudo systemctl start mongod

   # Windows: Download from https://www.mongodb.com/try/download/community
   ```

   **Option B: MongoDB Atlas (Cloud)**

   - Go to https://www.mongodb.com/atlas
   - Create free account and cluster
   - Update `MONGODB_URI` in `backend/.env`

5. **Start the backend server**

   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:3001
   ```

6. **Start the frontend development server**

   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

7. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
focus-guard-cam/
├── src/
│   ├── components/
│   │   ├── proctoring/     # Proctoring-specific components
│   │   │   ├── VideoMonitor.tsx
│   │   │   ├── ProctoringDashboard.tsx
│   │   │   ├── EventLog.tsx
│   │   │   ├── ProctoringReport.tsx
│   │   │   └── AlertsPanel.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/
│   │   ├── useDetection.ts     # Computer vision detection
│   │   ├── useVideoCapture.ts  # Video recording
│   │   ├── useAudioDetection.ts # Audio monitoring
│   │   └── useAlerts.ts        # Real-time alerts
│   ├── services/
│   │   └── api.ts          # Backend API client
│   ├── types/
│   │   └── proctoring.ts   # TypeScript definitions
│   └── pages/
│       └── Index.tsx       # Main application page
├── backend/
│   ├── server.js          # Express.js backend server
│   ├── package.json       # Backend dependencies
│   └── uploads/           # Video storage directory
└── README.md
```

## 🛠️ Technologies Used

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **TensorFlow.js** - Object detection
- **MediaPipe** - Face detection
- **WebRTC** - Camera access and recording

### Backend

- **Express.js** - Web server
- **MongoDB** - Database for persistent storage
- **Mongoose** - MongoDB object modeling
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation

### AI/ML Libraries

- **@tensorflow/tfjs** - TensorFlow.js runtime
- **@tensorflow-models/coco-ssd** - Object detection model
- **@mediapipe/face_detection** - Face detection
- **@huggingface/transformers** - Additional ML models

## 🎮 Usage

### Starting an Interview Session

1. **Enter Candidate Name** - Input the candidate's name
2. **Start Session** - Click "Start Session" to begin monitoring
3. **Enable Audio** - Optionally enable audio detection
4. **Start Recording** - Begin video recording of the session

### Monitoring Features

- **Focus Detection** - Automatically detects when candidate looks away
- **Object Detection** - Identifies phones, books, notes, and other devices
- **Face Tracking** - Monitors for multiple faces or absence
- **Audio Analysis** - Detects background noise and multiple voices
- **Real-time Alerts** - Instant notifications for violations

### Generating Reports

1. **View Report** - Click "Show Report" during or after session
2. **Export Data** - Download event logs as JSON
3. **Download Video** - Save recorded video files

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

### Detection Thresholds

Modify detection sensitivity in `src/hooks/useDetection.ts`:

```typescript
// Focus detection threshold
const isLookingAway = avgFocus < 50;

// Object detection confidence
const hasConfidence = pred.score > 0.5;

// Face detection confidence
minDetectionConfidence: 0.6;
```

## 📊 API Endpoints

### Sessions

- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id/end` - End session
- `GET /api/sessions` - List all sessions

### Events

- `POST /api/sessions/:id/events` - Add event to session

### Reports

- `GET /api/sessions/:id/report` - Generate proctoring report

### Files

- `POST /api/upload/video` - Upload video file
- `GET /api/videos/:filename` - Download video file

## 🚀 Deployment

### Backend (Express + MongoDB)

1. Configure environment

Create `backend/.env` with:

```
MONGODB_URI=mongodb://localhost:27017/focus-guard-cam
PORT=3001
```

2. Start backend

```bash
cd backend
npm install
npm start
```

This exposes APIs at `http://localhost:3001/api`:

- `POST /api/sessions` create a session
- `POST /api/sessions/:id/events` add event
- `PUT /api/sessions/:id/end` end session
- `GET /api/sessions/:id/report` session report JSON
- `POST /api/upload/video` upload recording (`video` FormData, optional `sessionId`)

### Frontend (Vite React)

1. Configure API base URL

Create `.env` in project root:

```
VITE_API_URL=http://localhost:3001/api
```

2. Start frontend

```bash
npm install
npm run dev
```

Open `http://localhost:8080` (or Vite’s port) to access the dashboard.

### Deployment

- Frontend: Deploy to Vercel/Netlify. Ensure `VITE_API_URL` points to your backend URL.
- Backend: Deploy to Render/Fly.io/Heroku or a VM. Provide `MONGODB_URI` and `PORT` env vars and open `/api` routes.

### Demo Checklist

1. Start backend and verify health:

```bash
curl http://localhost:3001/api/health
```

2. Start frontend, enter candidate name, start session.

3. Start monitoring, optionally Start Recording. Events appear in the Event Log.

4. End session, open Report. Use Export CSV/PDF.

5. If recording was made, it auto-uploads and can be downloaded from backend via `/api/videos/:filename`.

### Frontend (Vercel/Netlify)

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Deploy to Vercel**

   ```bash
   npx vercel --prod
   ```

3. **Deploy to Netlify**
   ```bash
   npx netlify deploy --prod --dir=dist
   ```

### Backend (Railway/Heroku)

1. **Set environment variables**

   ```env
   PORT=3001
   NODE_ENV=production
   ```

2. **Deploy to Railway**
   ```bash
   railway login
   railway init
   railway up
   ```

## 🧪 Testing

### Manual Testing

1. **Camera Access** - Test camera permissions
2. **Detection Accuracy** - Test with various objects
3. **Focus Detection** - Test looking away scenarios
4. **Audio Detection** - Test with background noise
5. **Recording** - Verify video recording works

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Privacy & Security

- **Local Processing** - All detection happens client-side
- **No Data Storage** - Videos stored locally unless uploaded
- **HTTPS Required** - Camera access requires secure context
- **Permission Based** - Explicit user consent for camera/microphone

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the code comments

## 🎯 Future Enhancements

- [ ] Eye closure/drowsiness detection
- [ ] Advanced gaze tracking
- [ ] PDF report generation
- [ ] Database integration
- [ ] Multi-language support
- [ ] Mobile app version
