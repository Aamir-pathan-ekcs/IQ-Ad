import mongoose from "mongoose";

const trackerData = new mongoose.Schema({
    loopCount: Number,
    advertiserID: String,
    orderID: String,
    lineItemID: String,
    creativeID:  String,
    clickTime: String
});

export default mongoose.model('IQ', trackerData);