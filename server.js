const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'website')));

// Home page route (3D robot landing page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'website', 'dashboard.html'));
});

// Store historical data
let historicalData = {
    successRates: [],
    errorCounts: {},
    transactionCounts: []
};

// AI Phrases for dynamic messages
const aiPhrases = {
    learning: [
        "Analyzing new transaction patterns...",
        "Interesting error cluster detected...",
        "Adapting to network conditions..."
    ],
    success: [
        "Success rate improving. Adaptation successful.",
        "Network efficiency optimization achieved.",
        "New successful pattern identified and stored."
    ],
    discovery: [
        "Discovered new error type. Adding to database.",
        "Unusual transaction pattern detected.",
        "Network behavior anomaly identified."
    ]
};

function getRandomPhrase(type) {
    const phrases = aiPhrases[type];
    return phrases[Math.floor(Math.random() * phrases.length)];
}

function generateDynamicData() {
    // Generate varying success rate (65-85%)
    const successRate = 65 + Math.floor(Math.random() * 20);
    historicalData.successRates.push(successRate);
    
    // Keep last 30 data points
    if (historicalData.successRates.length > 30) {
        historicalData.successRates.shift();
    }

    // Calculate dynamic transaction counts
    const baseCount = 2 + Math.floor(Math.random() * 4);
    const txPerMinute = baseCount;
    const last5min = baseCount * (3 + Math.floor(Math.random() * 3));
    const last15min = last5min + (5 + Math.floor(Math.random() * 5));

    // Generate dynamic error counts
    const errorTypes = {
        '1': Math.floor(Math.random() * 3),
        '1771': Math.floor(Math.random() * 2),
        '6001': 15 + Math.floor(Math.random() * 10),
        '6002': Math.floor(Math.random() * 3),
        'unknown': Math.floor(Math.random() * 4)
    };

    // Calculate AI Score based on success rate trend
    const aiScore = Math.min(100, Math.floor(
        (historicalData.successRates.reduce((a, b) => a + b, 0) / 
        historicalData.successRates.length)
    ));

    // Determine message type based on metrics
    let messageType;
    if (successRate > 80) messageType = 'success';
    else if (Object.values(errorTypes).reduce((a, b) => a + b, 0) > 
             Object.values(historicalData.errorCounts).reduce((a, b) => a + b, 0)) {
        messageType = 'discovery';
    } else {
        messageType = 'learning';
    }

    historicalData.errorCounts = errorTypes;

    return {
        timestamp: new Date().toISOString(),
        metrics: {
            txPerMinute,
            successRate,
            maxSuccessStreak: 35 + Math.floor(Math.random() * 20),
            timeWindows: {
                last1min: txPerMinute,
                last5min: last5min,
                last15min: last15min
            },
            errorTypes
        },
        aiScore,
        message: getRandomPhrase(messageType)
    };
}

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// WebSocket connection handling
wss.on('connection', ws => {
    console.log('New client connected');
    
    // Send initial data
    const initialData = generateDynamicData();
    ws.send(JSON.stringify(initialData));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`AIgent Smith Network Online - http://localhost:${PORT}`);
    
    // Update data every 10 seconds
    setInterval(() => {
        const newData = generateDynamicData();
        console.log('Generating new data:', newData);
        broadcast(newData);
    }, 10000);
}); 