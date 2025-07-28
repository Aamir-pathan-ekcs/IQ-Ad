import mongoose from "mongoose";

const trackerData = new mongoose.Schema({
    loopCount: Number,
    advertiserId: String,
    orderId: String,
    lineItemId: String,
    creativeId:  String,
    clickTime: String
});

export default mongoose.model('IQ', trackerData);