import mongoose from "mongoose";

const trackerData = new mongoose.Schema({
    loopCount: Number,
    adhesion: Number,
    advertiserID: String,
    orderID: String,
    lineItemID: String,
    creativeID:  String,
    video_db: {
        firstQuarter: {type: Number, default: 0},
        secondQuarter: {type: Number, default: 0},
        thirdQuarter: {type: Number, default: 0},
        fourthQuarter: {type: Number, default: 0}
    },
    clickTime: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    }
});

export default mongoose.model('IQ', trackerData);