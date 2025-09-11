const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Import database connection
const connectDB = require("./config/database");

// Import models
const Session = require("./models/Session");
const Video = require("./models/Video");

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// MongoDB will handle data persistence

// API Routes

// Create a new interview session
app.post("/api/sessions", async (req, res) => {
  try {
    const { candidateName } = req.body;

    if (!candidateName) {
      return res.status(400).json({ error: "Candidate name is required" });
    }

    const sessionId = uuidv4();
    const session = new Session({
      id: sessionId,
      candidateName,
      startTime: new Date(),
      status: "active",
      integrityScore: 100,
      events: [],
    });

    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get session by ID
app.get("/api/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ id });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Add event to session
app.post("/api/sessions/:id/events", async (req, res) => {
  try {
    const { id } = req.params;
    const event = req.body;

    const session = await Session.findOne({ id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const newEvent = {
      id: uuidv4(),
      ...event,
      timestamp: new Date(),
    };

    session.events.push(newEvent);

    // Update session integrity score
    let score = 100;
    session.events.forEach((e) => {
      switch (e.severity) {
        case "high":
          score -= 10;
          break;
        case "medium":
          score -= 5;
          break;
        case "low":
          score -= 2;
          break;
      }
    });
    session.integrityScore = Math.max(0, score);

    await session.save();
    res.json(newEvent);
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ error: "Failed to add event" });
  }
});

// End session
app.put("/api/sessions/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ id });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.endTime = new Date();
    session.status = "completed";
    await session.save();

    res.json(session);
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Get all sessions
app.get("/api/sessions", async (req, res) => {
  try {
    const allSessions = await Session.find().sort({ startTime: -1 });
    res.json(allSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Upload video file
app.post("/api/upload/video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const video = new Video({
      filename: req.file.filename,
      originalName: req.file.originalname,
      sessionId: req.body.sessionId || null,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    await video.save();

    res.json({
      message: "Video uploaded successfully",
      filename: req.file.filename,
      path: req.file.path,
      videoId: video._id,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// Download video file
app.get("/api/videos/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Video file not found" });
  }

  res.download(filePath);
});

// Generate proctoring report
app.get("/api/sessions/:id/report", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ id });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const duration = session.endTime
      ? Math.round((session.endTime - session.startTime) / 1000 / 60)
      : Math.round((new Date() - session.startTime) / 1000 / 60);

    const report = {
      sessionId: session.id,
      candidateName: session.candidateName,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: duration,
      integrityScore: session.integrityScore,
      totalEvents: session.events.length,
      eventsByType: {
        focusLost: session.events.filter((e) => e.type === "focus_lost").length,
        noFace: session.events.filter((e) => e.type === "no_face").length,
        multipleFaces: session.events.filter((e) => e.type === "multiple_faces")
          .length,
        phoneDetected: session.events.filter((e) => e.type === "phone_detected")
          .length,
        notesDetected: session.events.filter((e) => e.type === "notes_detected")
          .length,
        deviceDetected: session.events.filter(
          (e) => e.type === "device_detected"
        ).length,
      },
      events: session.events,
    };

    res.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
