const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    cuisine: { type: String, required: true },
    rating: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' }, // For Base64 encoded image
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        ref: 'User'
    },
    isOpen: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);
