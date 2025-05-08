// netlify/functions/get-spotify-playlist.js

// We'll use node-fetch for making HTTP requests.
// Netlify will automatically install this if you have a package.json,
// or you can often use it directly if Netlify's Node version supports it.
// For robustness, let's assume 'node-fetch' needs to be available.
// If you test locally: npm init -y && npm install node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID; // Get this from env var

exports.handler = async function(event, context) {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !PLAYLIST_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spotify API credentials or Playlist ID not configured in environment variables." }),
        };
    }

    try {
        // 1. Get Access Token from Spotify
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            console.error("Spotify Token API Error:", tokenResponse.status, errorBody);
            throw new Error(`Spotify Token API Error: ${tokenResponse.status} - ${errorBody}`);
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Get Playlist Tracks from Spotify
        // Fetches name, artists, album art, spotify link, and 30s preview URL
        const fields = 'items(track(name,artists(name),album(images),external_urls(spotify),preview_url))';
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=${fields}&limit=20`, { // Limit to 20 songs for example
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!playlistResponse.ok) {
            const errorBody = await playlistResponse.text();
            console.error("Spotify Playlist API Error:", playlistResponse.status, errorBody);
            throw new Error(`Spotify Playlist API Error: ${playlistResponse.status} - ${errorBody}`);
        }
        const playlistData = await playlistResponse.json();

        const tracks = playlistData.items.map(item => {
            if (!item.track) return null; // Skip if track data is missing (e.g., local files in playlist)
            return {
                name: item.track.name,
                artist: item.track.artists.map(artist => artist.name).join(', '),
                albumArt: item.track.album.images.length > 0 ? item.track.album.images[0].url : 'images/default_album_art.png', // Provide a default image path
                spotifyUrl: item.track.external_urls.spotify,
                previewUrl: item.track.preview_url
            };
        }).filter(track => track !== null); // Filter out any null tracks

        return {
            statusCode: 200,
            body: JSON.stringify(tracks),
        };

    } catch (error) {
        console.error("Error in get-spotify-playlist function:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch Spotify playlist. ' + error.message }),
        };
    }
};