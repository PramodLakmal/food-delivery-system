const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    availability: { type: Boolean, default: true },
    category: {
        type: String,
        enum: ["Starter", "Main", "Dessert", "Drink", "Other"],
        default: "Other"
    },
    imageUrl: { type: String, default: '' }, // For Base64 encoded image
    isDeleted: { type: Boolean, default: false } // 👈 NEW
}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);
