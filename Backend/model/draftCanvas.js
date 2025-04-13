const mongoose = require("mongoose");

const draftCanvasSchema = new mongoose.Schema(
    {
        name: String,
        elements: Array,
        userEmail: String,
        createdAt: { type: Date, default: Date.now },
    }, 
    {timestamps: true}
);

const DraftCanvas = mongoose.model("DraftCanvas", draftCanvasSchema);

module.exports = DraftCanvas;

