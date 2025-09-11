const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    sessionId: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", VideoSchema);
