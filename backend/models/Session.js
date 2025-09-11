const mongoose = require("mongoose");

const ProctoringEventSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "focus_lost",
      "no_face",
      "multiple_faces",
      "phone_detected",
      "notes_detected",
      "device_detected",
    ],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  duration: { type: Number },
});

const SessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    candidateName: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
    integrityScore: { type: Number, default: 100 },
    events: [ProctoringEventSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", SessionSchema);
