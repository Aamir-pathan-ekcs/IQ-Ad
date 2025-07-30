import mongoose from 'mongoose';

const trackerSchema = new mongoose.Schema({
    advertiserID: String,
    orderID: String,
    lineItemID: String,
    creativeID: String,
    loopCount: Number,
    adhesion: Number,
    video_db: {
        firstQuarter: Number,
        secondQuarter: Number,
        thirdQuarter: Number,
        fourthQuarter: Number
    },
    // other fields as needed
});

export default mongoose.model('tracker', trackerSchema);
