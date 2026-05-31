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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/account/:gameName/:tagLine', async (req, res) => {
    const { gameName, tagLine } = req.params;
    const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const response = await fetch(url, { headers });
    res.status(response.status).json(await response.json());
});

app.get('/api/matches/:puuid', async (req, res) => {
    const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${req.params.puuid}/ids?count=20`;
    const response = await fetch(url, { headers });
    res.status(response.status).json(await response.json());
});

app.get('/api/match/:matchId', async (req, res) => {
    const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${req.params.matchId}`;
    const response = await fetch(url, { headers });
    res.status(response.status).json(await response.json());
});

app.get('/api/timeline/:matchId', async (req, res) => {
    const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${req.params.matchId}/timeline`;
    const response = await fetch(url, { headers });
    res.status(response.status).json(await response.json());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));