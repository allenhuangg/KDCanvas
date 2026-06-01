const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const RIOT_API_KEY = process.env.RIOT_API_KEY; 
const REGION = 'americas'; 
const headers = { 'X-Riot-Token': RIOT_API_KEY };

// Helper function to handle Riot API rate limits (HTTP 429) automatically
// Upgraded, robust retry handler
async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            
            // Scenario 1: Riot Rate Limits (429)
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('retry-after')) || 2;
                console.warn(`[429 Rate Limit Hit] Attempt ${i + 1}/${retries}. Waiting ${retryAfter}s...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue; // Retry
            }
            
            // Scenario 2: Riot Server Crashes (500, 502, 503, 504)
            if (response.status >= 500 && response.status <= 504) {
                console.warn(`[Riot Server Error ${response.status}] Attempt ${i + 1}/${retries}. Retrying in 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue; // Retry
            }
            
            // Do not retry on permanent errors (400 Bad Request, 403 Forbidden, 404 Not Found)
            return response;

        } catch (networkError) {
            // Scenario 3: Physical network drops, closed sockets, or DNS failures
            console.warn(`[Network Offline/Error] ${networkError.message}. Attempt ${i + 1}/${retries}. Retrying in 2s...`);
            
            if (i === retries - 1) {
                throw new Error(`Connection lost. Max retries exceeded. Details: ${networkError.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Loop automatically retries
        }
    }
    throw new Error('API Request failed: Max retries reached.');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/account/:gameName/:tagLine', async (req, res) => {
    const { gameName, tagLine } = req.params;
    const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    try {
        const response = await fetchWithRetry(url, { headers });
        res.status(response.status).json(await response.json());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/matches/:puuid', async (req, res) => {
    // Increased from 20 to 100 to provide a buffer for discarding Arena matches
    const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${req.params.puuid}/ids?count=100`;
    try {
        const response = await fetchWithRetry(url, { headers });
        res.status(response.status).json(await response.json());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/match/:matchId', async (req, res) => {
    const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${req.params.matchId}`;
    try {
        const response = await fetchWithRetry(url, { headers });
        res.status(response.status).json(await response.json());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/timeline/:matchId', async (req, res) => {
    const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${req.params.matchId}/timeline`;
    try {
        const response = await fetchWithRetry(url, { headers });
        res.status(response.status).json(await response.json());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));