import mysql from 'mysql2/promise';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool configuration
const pool = mysql.createPool({
    host: 'localhost:3306',
    user: 'News_Quest',
    password: 'Newsquest@@123',
    database: 'admin_news_Track',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Initialize database and create table
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS tracker_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                advertiserID VARCHAR(255),
                orderID VARCHAR(255),
                lineItemID VARCHAR(255),
                creativeID VARCHAR(255),
                loopCount INT DEFAULT 0,
                adhesion INT DEFAULT 0,
                firstQuarter INT DEFAULT 0,
                secondQuarter INT DEFAULT 0,
                thirdQuarter INT DEFAULT 0,
                fourthQuarter INT DEFAULT 0,
                clickTime DATE DEFAULT (CURDATE()),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_tracker (advertiserID, orderID, lineItemID, creativeID)
            )
        `;
        
        await connection.execute(createTableQuery);
        console.log('Database table initialized');
        connection.release();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

app.post('/track', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        console.log("Received data:", req.body);
        const data = req.body;

        // Transform video_db data
        let transformedVideoData = {
            firstQuarter: 0,
            secondQuarter: 0,
            thirdQuarter: 0,
            fourthQuarter: 0
        };

        if (data.video_db) {
            transformedVideoData = {
                firstQuarter: typeof data.video_db["first-quarter"] === 'number' ? data.video_db["first-quarter"] : 0,
                secondQuarter: typeof data.video_db["second-quarter"] === 'number' ? data.video_db["second-quarter"] : 0,
                thirdQuarter: typeof data.video_db["third-quarter"] === 'number' ? data.video_db["third-quarter"] : 0,
                fourthQuarter: typeof data.video_db["fourth-quarter"] === 'number' ? data.video_db["fourth-quarter"] : 0
            };
        }

        const {
            advertiserID,
            orderID,
            lineItemID,
            creativeID,
            loopCount = 0,
            adhesion = 0
        } = data;

        // Check if record exists
        const selectQuery = `
            SELECT * FROM tracker_data 
            WHERE advertiserID = ? AND orderID = ? AND lineItemID = ? AND creativeID = ?
        `;
        
        const [existingRows] = await connection.execute(selectQuery, [
            advertiserID, orderID, lineItemID, creativeID
        ]);

        if (existingRows.length > 0) {
            // Update existing record
            const existingRow = existingRows[0];
            
            const updateQuery = `
                UPDATE tracker_data 
                SET 
                    loopCount = loopCount + ?,
                    adhesion = adhesion + ?,
                    firstQuarter = firstQuarter + ?,
                    secondQuarter = secondQuarter + ?,
                    thirdQuarter = thirdQuarter + ?,
                    fourthQuarter = fourthQuarter + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE advertiserID = ? AND orderID = ? AND lineItemID = ? AND creativeID = ?
            `;
            
            await connection.execute(updateQuery, [
                loopCount,
                adhesion,
                transformedVideoData.firstQuarter,
                transformedVideoData.secondQuarter,
                transformedVideoData.thirdQuarter,
                transformedVideoData.fourthQuarter,
                advertiserID,
                orderID,
                lineItemID,
                creativeID
            ]);
            
            res.status(200).send({ success: true, message: 'Data Updated' });
        } else {
            // Insert new record
            const insertQuery = `
                INSERT INTO tracker_data 
                (advertiserID, orderID, lineItemID, creativeID, loopCount, adhesion, 
                 firstQuarter, secondQuarter, thirdQuarter, fourthQuarter, clickTime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
            `;
            
            await connection.execute(insertQuery, [
                advertiserID,
                orderID,
                lineItemID,
                creativeID,
                loopCount,
                adhesion,
                transformedVideoData.firstQuarter,
                transformedVideoData.secondQuarter,
                transformedVideoData.thirdQuarter,
                transformedVideoData.fourthQuarter
            ]);
            
            res.status(201).send({ success: true, message: 'Data saved' });
        }
        
    } catch (error) {
        console.log('Error saving data:', error);
        res.status(500).send({ success: false, message: 'Server Error' });
    } finally {
        connection.release();
    }
});

// Additional endpoint to get tracker data
app.get('/track/:advertiserID/:orderID/:lineItemID/:creativeID', async (req, res) => {
    try {
        const { advertiserID, orderID, lineItemID, creativeID } = req.params;
        
        const selectQuery = `
            SELECT * FROM tracker_data 
            WHERE advertiserID = ? AND orderID = ? AND lineItemID = ? AND creativeID = ?
        `;
        
        const [rows] = await pool.execute(selectQuery, [
            advertiserID, orderID, lineItemID, creativeID
        ]);
        
        if (rows.length > 0) {
            res.status(200).json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Data not found' });
        }
    } catch (error) {
        console.log('Error fetching data:', error);
        res.status(500).send({ success: false, message: 'Server Error' });
    }
});

// Get all tracker data with pagination
app.get('/track', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const selectQuery = `
            SELECT * FROM tracker_data 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const countQuery = `SELECT COUNT(*) as total FROM tracker_data`;
        
        const [rows] = await pool.execute(selectQuery, [limit, offset]);
        const [countResult] = await pool.execute(countQuery);
        const total = countResult[0].total;
        
        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log('Error fetching data:', error);
        res.status(500).send({ success: false, message: 'Server Error' });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

// Initialize and start server
async function startServer() {
    await testConnection();
    await initializeDatabase();
    
    app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });
}

startServer().catch(console.error);