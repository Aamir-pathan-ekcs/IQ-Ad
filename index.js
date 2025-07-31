import mongoose from 'mongoose';
import express from 'express';
import tracker from './models/tracker.js';
import cors from 'cors';
import bodyParser from 'body-parser';


const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));
const allowedOrigins = [
  'https://www.theinterestingtimes.co.uk',
  'https://dev.ekcs.co',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());


const uri = 'mongodb+srv://aamirpathan:x6nxQMyFAkaArOJ7@cluster0.eyh3o9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("Connection failed:", err));

app.use((req, res, next) => {
  if (
    req.is('text/plain') &&
    req.method === 'POST' &&
    req.get('user-agent') &&
    req.body &&
    typeof req.body === 'string'
  ) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      console.error('Invalid JSON in plain-text POST body', e);
    }
  }
  next();
});

app.post('/track', async (req, res)=>{
    try{
    let data;
    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString('utf8');
      try {
        data = JSON.parse(rawBody);
      } catch (err) {
        console.error("Failed to parse raw body:", err);
        return res.status(400).json({ success: false, message: "Invalid JSON" });
      }
    } else {
      data = req.body;
    }


        if(data.video_db) {
            const transformData = {
                firstQuarter: typeof data.video_db["first-quarter"] === 'number' ? data.video_db["first-quarter"] : 0,
                secondQuarter: typeof data.video_db["second-quarter"] === 'number' ? data.video_db["second-quarter"] : 0,
                thirdQuarter: typeof data.video_db["third-quarter"] === 'number' ? data.video_db["third-quarter"] : 0,
                fourthQuarter: typeof data.video_db["fourth-quarter"] === 'number' ? data.video_db["fourth-quarter"] : 0
            }
            data.video_db = transformData;
        }

        const {advertiserID, orderID, lineItemID, creativeID, loopCount, adhesion, 
               video_db, ...restFields} = data;
        const existingDoc = await tracker.findOne({advertiserID, orderID, lineItemID, creativeID});
        if(existingDoc) {
            existingDoc.adhesion = (existingDoc.adhesion || 0) + (adhesion || 0);
            existingDoc.loopCount = (existingDoc.loopCount || 0) + (loopCount || 0);

            if(video_db) {
                existingDoc.video_db.firstQuarter = (existingDoc.video_db.firstQuarter || 0) + (video_db.firstQuarter || 0);
                existingDoc.video_db.secondQuarter = (existingDoc.video_db.secondQuarter || 0) + (video_db.secondQuarter || 0);
                existingDoc.video_db.thirdQuarter = (existingDoc.video_db.thirdQuarter || 0) + (video_db.thirdQuarter || 0);
                existingDoc.video_db.fourthQuarter = (existingDoc.video_db.fourthQuarter || 0) + (video_db.fourthQuarter || 0);
            }

            Object.assign(existingDoc, restFields);
            await existingDoc.save();
            res.status(200).send({success: true, message: 'Data Updated'});
        }else {    
            const trackerData = new tracker(data);
            await trackerData.save();
            res.status(201).send({ success: true, message: 'Data saved' });
        }
    }catch(error) {
        console.log('Error data saving:',error);
        res.status(500).send({ success: false, message: 'Server Error'});

    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));