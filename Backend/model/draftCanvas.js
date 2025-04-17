const mongoose = require("mongoose");

const draftCanvasSchema = new mongoose.Schema(
    {
        name: String,
        elements: Array,
        userEmail: String,
        canvasType: 
        {
            type:String,
            default:"story"
        },
        board: String,
        createdAt: { type: Date, default: Date.now },
    }, 
    {timestamps: true}
);

const DraftCanvas = mongoose.model("DraftCanvas", draftCanvasSchema);

module.exports = DraftCanvas;

