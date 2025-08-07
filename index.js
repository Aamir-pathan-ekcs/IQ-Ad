import express from 'express';
import tracker from './models/tracker_mysql.js';
import cors from 'cors';
import sequelize from './db.js';
import bodyParser from 'body-parser';


const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
}));
// const allowedOrigins = [
//   'https://www.theinterestingtimes.co.uk',
//   'https://dev.ekcs.co',
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// }));
app.use(express.json());
await sequelize.authenticate().then(() => console.log('Connection successful!'))
  .catch(err => console.error('Connection error:', err));
console.log('Connected to MySQL');
await sequelize.sync();

// const uri = 'mongodb+srv://khan:x6yFAOJ7@cluster0.eyh3o9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// mongoose.connect(uri).then(() => console.log("Connected to MongoDB Atlas"))
// .catch(err => console.error("Connection failed:", err));

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

app.post('/track', async (req, res) => {
  try {
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

    if (data.video_db) {
      const transformData = {
        firstQuarter: typeof data.video_db["first-quarter"] === 'number' ? data.video_db["first-quarter"] : 0,
        secondQuarter: typeof data.video_db["second-quarter"] === 'number' ? data.video_db["second-quarter"] : 0,
        thirdQuarter: typeof data.video_db["third-quarter"] === 'number' ? data.video_db["third-quarter"] : 0,
        fourthQuarter: typeof data.video_db["fourth-quarter"] === 'number' ? data.video_db["fourth-quarter"] : 0
      };
      data.firstQuarter = transformData.firstQuarter;
      data.secondQuarter = transformData.secondQuarter;
      data.thirdQuarter = transformData.thirdQuarter;
      data.fourthQuarter = transformData.fourthQuarter;
    }

    const { advertiserID, orderID, lineItemID, creativeID, fileName, loopCount, expand, ...rest } = data;

    let trackerData = await tracker.findOne({
      where: { advertiserID, orderID, lineItemID, creativeID }
    });

    if (trackerData) {
      trackerData.expand += expand || 0;
      trackerData.loopCount += loopCount || 0;
      trackerData.fileName = data.fileName;
      trackerData.firstQuarter += data.firstQuarter || 0;
      trackerData.secondQuarter += data.secondQuarter || 0;
      trackerData.thirdQuarter += data.thirdQuarter || 0;
      trackerData.fourthQuarter += data.fourthQuarter || 0;

      await trackerData.save();
      res.status(200).send({ success: true, message: 'Data Updated' });
    } else {
      await tracker.create({ advertiserID, orderID, lineItemID, creativeID, loopCount: loopCount || 0, expand: expand || 0, ...data });
      res.status(201).send({ success: true, message: 'Data saved' });
    }
  } catch (error) {
    console.log('Error saving data:', error);
    res.status(500).send({ success: false, message: 'Server Error' });
  }
});

app.listen(3015, () => console.log('Server running'));