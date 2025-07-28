import mongoose from 'mongoose';
import express from 'express';
import tracker from './models/tracker.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());


const uri = 'mongodb+srv://aamirpathan:x6nxQMyFAkaArOJ7@cluster0.eyh3o9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("Connection failed:", err));

app.post('/track', async (req, res)=>{
    try{
        const data = req.body;
        const trackerData = new tracker(data);
        await trackerData.save();
        res.status(201).send({ success: true, message: 'Data saved' });
    }catch(error) {
        console.log('Error data saving:',error);
        res.status(500).send({ success: false, message: 'Server Error'});

    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));