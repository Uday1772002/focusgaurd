# Focus Guard Cam - Demo Script

## 🎬 Demo Video Outline (2-3 minutes)

### 1. Introduction (30 seconds)

- **Show the application interface**
- **Explain the purpose**: "This is Focus Guard Cam, a video proctoring system for online interviews"
- **Highlight key features**: Real-time monitoring, AI detection, professional reporting

### 2. Starting a Session (30 seconds)

- **Enter candidate name**: "John Doe"
- **Click "Start Session"**
- **Show camera access prompt**
- **Demonstrate live video feed with detection overlays**

### 3. Detection Features (60 seconds)

- **Focus Detection**: Look away from camera for >5 seconds
  - Show alert: "Looking away for 6 seconds"
  - Explain: "System detects when candidate is not focused"
- **Object Detection**: Show phone, book, or notes
  - Place phone in frame
  - Show alert: "Mobile phone detected in frame"
  - Explain: "AI identifies unauthorized items"
- **Face Detection**: Cover face or show multiple people
  - Cover camera briefly
  - Show alert: "No face detected for 12 seconds"
  - Explain: "Monitors for absence or multiple faces"

### 4. Audio Detection (30 seconds)

- **Click "Start Audio"**
- **Show volume indicator**
- **Make background noise or have someone else speak**
- **Show alert**: "Background noise detected" or "Multiple voices detected"

### 5. Recording & Reporting (30 seconds)

- **Click "Start Recording"**
- **Show recording indicator**
- **Click "Show Report"**
- **Highlight integrity score and violation breakdown**
- **Explain**: "Comprehensive report with all violations"

### 6. Conclusion (30 seconds)

- **Show final integrity score**
- **Highlight professional UI and real-time alerts**
- **Mention**: "Ready for production use with backend API"

## 🎯 Key Points to Emphasize

### Technical Features

- ✅ Real-time computer vision detection
- ✅ AI-powered object recognition
- ✅ Professional monitoring interface
- ✅ Video recording and storage
- ✅ Comprehensive reporting system
- ✅ Audio detection capabilities
- ✅ Real-time alert system

### Assignment Requirements Met

- ✅ Focus detection (>5 seconds)
- ✅ Face detection and multiple faces
- ✅ Object detection (phones, books, notes)
- ✅ Event logging with timestamps
- ✅ Integrity scoring system
- ✅ Professional UI/UX
- ✅ Video recording functionality
- ✅ Backend API integration
- ✅ Real-time alerts
- ✅ Audio detection (bonus)

## 📝 Demo Tips

### Before Recording

1. **Test all features** to ensure they work
2. **Prepare props**: phone, book, notes
3. **Set up good lighting** for camera
4. **Have backup plan** if detection doesn't work immediately

### During Recording

1. **Speak clearly** and explain each feature
2. **Show the UI** while demonstrating
3. **Wait for alerts** to appear before moving on
4. **Highlight the professional design**

### After Recording

1. **Edit for clarity** if needed
2. **Add captions** for better understanding
3. **Keep it under 3 minutes**
4. **Show the live demo URL** at the end

## 🔗 Live Demo URLs

- **Frontend**: https://focus-guard-cam.vercel.app
- **Backend**: https://focus-guard-cam-backend.railway.app
- **GitHub**: https://github.com/yourusername/focus-guard-cam

## 📊 Sample Proctoring Report

```json
{
  "sessionId": "session-1234567890",
  "candidateName": "John Doe",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T10:30:00Z",
  "duration": 30,
  "integrityScore": 85,
  "totalEvents": 3,
  "eventsByType": {
    "focusLost": 1,
    "noFace": 0,
    "multipleFaces": 0,
    "phoneDetected": 1,
    "notesDetected": 0,
    "deviceDetected": 1
  },
  "events": [
    {
      "id": "event-1",
      "type": "focus_lost",
      "timestamp": "2024-01-15T10:05:00Z",
      "description": "Looking away for 6 seconds",
      "severity": "medium",
      "duration": 6
    },
    {
      "id": "event-2",
      "type": "phone_detected",
      "timestamp": "2024-01-15T10:15:00Z",
      "description": "Mobile phone detected in frame",
      "severity": "high"
    }
  ]
}
```

## 🎉 Ready for Demo!

The system is fully functional and ready for demonstration. All core requirements and bonus features are implemented with a professional UI and comprehensive functionality.
