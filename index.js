import mongoose from 'mongoose';
import express from 'express';
import tracker from './models/tracker.js';
import cors from 'cors';

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Enhanced body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add raw body parser for sendBeacon requests
app.use('/track', express.raw({ type: 'application/json', limit: '50mb' }), (req, res, next) => {
    if (req.body && req.body.length > 0) {
        try {
            // Convert Buffer to string and parse JSON
            const bodyStr = req.body.toString('utf8');
            req.body = JSON.parse(bodyStr);
            console.log('Parsed sendBeacon data:', req.body);
        } catch (error) {
            console.log('Error parsing raw body, trying as regular JSON:', error.message);
        }
    }
    next();
});

const uri = 'mongodb+srv://aamirpathan:x6nxQMyFAkaArOJ7@cluster0.eyh3o9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("Connection failed:", err));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

app.post('/track', async (req, res) => {
    try {
        console.log('=== Received tracking request ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        let data = req.body;
        
        // Handle case where data might be empty or malformed
        if (!data || Object.keys(data).length === 0) {
            console.log('Empty or invalid request body');
            return res.status(400).json({ success: false, message: 'Empty request body' });
        }

        // Validate required fields
        if (!data.advertiserID || !data.orderID || !data.lineItemID || !data.creativeID) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: advertiserID, orderID, lineItemID, creativeID' 
            });
        }

        // Transform video_db if present
        if (data.video_db) {
            console.log('Original video_db:', data.video_db);
            
            const transformData = {
                firstQuarter: 0,
                secondQuarter: 0,
                thirdQuarter: 0,
                fourthQuarter: 0
            };

            // Handle different data types for quarters
            if (data.video_db["first-quarter"] !== undefined) {
                if (typeof data.video_db["first-quarter"] === 'number') {
                    transformData.firstQuarter = data.video_db["first-quarter"];
                } else if (data.video_db["first-quarter"] === true || data.video_db["first-quarter"] === 1) {
                    transformData.firstQuarter = 1;
                }
            }

            if (data.video_db["second-quarter"] !== undefined) {
                if (typeof data.video_db["second-quarter"] === 'number') {
                    transformData.secondQuarter = data.video_db["second-quarter"];
                } else if (data.video_db["second-quarter"] === true || data.video_db["second-quarter"] === 1) {
                    transformData.secondQuarter = 1;
                }
            }

            if (data.video_db["third-quarter"] !== undefined) {
                if (typeof data.video_db["third-quarter"] === 'number') {
                    transformData.thirdQuarter = data.video_db["third-quarter"];
                } else if (data.video_db["third-quarter"] === true || data.video_db["third-quarter"] === 1) {
                    transformData.thirdQuarter = 1;
                }
            }

            if (data.video_db["fourth-quarter"] !== undefined) {
                if (typeof data.video_db["fourth-quarter"] === 'number') {
                    transformData.fourthQuarter = data.video_db["fourth-quarter"];
                } else if (data.video_db["fourth-quarter"] === true || data.video_db["fourth-quarter"] === 1) {
                    transformData.fourthQuarter = 1;
                }
            }

            data.video_db = transformData;
            console.log('Transformed video_db:', data.video_db);
        }

        const { advertiserID, orderID, lineItemID, creativeID, loopCount, adhesion, video_db, ...restFields } = data;
        
        console.log('Searching for existing document with:', { advertiserID, orderID, lineItemID, creativeID });
        
        const existingDoc = await tracker.findOne({ advertiserID, orderID, lineItemID, creativeID });
        
        if (existingDoc) {
            console.log('Found existing document, updating...');
            console.log('Existing doc before update:', JSON.stringify(existingDoc, null, 2));
            
            // Update adhesion
            existingDoc.adhesion = (existingDoc.adhesion || 0) + (adhesion || 0);
            
            // Update loop count
            existingDoc.loopCount = (existingDoc.loopCount || 0) + (loopCount || 0);

            // Update video_db if present
            if (video_db) {
                // Initialize video_db if it doesn't exist
                if (!existingDoc.video_db) {
                    existingDoc.video_db = {
                        firstQuarter: 0,
                        secondQuarter: 0,
                        thirdQuarter: 0,
                        fourthQuarter: 0
                    };
                }
                
                existingDoc.video_db.firstQuarter = (existingDoc.video_db.firstQuarter || 0) + (video_db.firstQuarter || 0);
                existingDoc.video_db.secondQuarter = (existingDoc.video_db.secondQuarter || 0) + (video_db.secondQuarter || 0);
                existingDoc.video_db.thirdQuarter = (existingDoc.video_db.thirdQuarter || 0) + (video_db.thirdQuarter || 0);
                existingDoc.video_db.fourthQuarter = (existingDoc.video_db.fourthQuarter || 0) + (video_db.fourthQuarter || 0);
            }

            // Update other fields
            Object.assign(existingDoc, restFields);
            
            console.log('Document after updates:', JSON.stringify(existingDoc, null, 2));
            
            await existingDoc.save();
            console.log('Document updated successfully');
            
            res.status(200).json({ success: true, message: 'Data Updated', data: existingDoc });
        } else {
            console.log('No existing document found, creating new one...');
            console.log('Data to save:', JSON.stringify(data, null, 2));
            
            const trackerData = new tracker(data);
            const savedData = await trackerData.save();
            
            console.log('New document saved:', JSON.stringify(savedData, null, 2));
            
            res.status(201).json({ success: true, message: 'Data saved', data: savedData });
        }
        
    } catch (error) {
        console.error('Error in /track endpoint:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error', 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;