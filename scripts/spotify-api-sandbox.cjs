var dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { initNetwork } = require("./utils.cjs");
initNetwork();

// Utiliser undici.fetch si dispo, sinon global fetch (Node >=18)
const { fetch: undiciFetch } = require('undici');
const fetchFn = globalThis.fetch || undiciFetch;

const { fetchPlaylistById } = require("../src/api/spotify-playlists");

function encodeBasicAuth(clientId, clientSecret) {
  return Buffer.from(clientId + ":" + clientSecret, "utf8").toString("base64");
}

function generateAccessToken() {
  // Accepte SPOTIFY_CLIENT_ID ou VITE_SPOTIFY_CLIENT_ID
  var clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
  var clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Promise.reject(
      new Error(
        "Missing SPOTIFY_CLIENT_ID (or VITE_SPOTIFY_CLIENT_ID) or SPOTIFY_CLIENT_SECRET in .env.local"
      )
    );
  }

  var base64AuthString = encodeBasicAuth(clientId, clientSecret);
  return fetchFn("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + base64AuthString,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.error) {
        var desc = data.error_description || (data.error && data.error.message) || String(data.error);
        throw new Error("Error fetching access token: " + desc);
      }
      return data.access_token;
    });
}

var playlistId = process.argv[2] || process.env.PLAYLIST_ID || "2IgPkhcHbgQ4s4PdCxljAx";
var topN = parseInt(process.env.TOP_N || process.argv[3] || '5', 10);

generateAccessToken()
  .then((token) => fetchPlaylistById(token, playlistId))
  .then((res) => {
    // Supporte { data }, { playlist } ou l’objet playlist direct
    const playlist = res && (res.data || res.playlist || res);
    if (!playlist || !playlist.tracks || !Array.isArray(playlist.tracks.items)) {
      throw new Error("Unexpected response shape from fetchPlaylistById");
    }

    // Compte des apparitions d’artistes
    const artistMap = new Map();
    for (const item of playlist.tracks.items) {
      const artists = item?.track?.artists;
      if (!Array.isArray(artists)) continue;
      for (const artist of artists) {
        if (!artist?.id) continue;
        const prev = artistMap.get(artist.id);
        if (prev) {
          prev.count += 1;
        } else {
          artistMap.set(artist.id, { id: artist.id, name: artist.name, count: 1 });
        }
      }
    }

    // Trie et limite au Top N
    const sorted = Array.from(artistMap.values()).sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, Math.max(1, topN));

    console.log(`Top ${top.length} Artists:`);
    console.table(
      top.map((a) => ({
        Artist: a.name,
        'Number of Tracks': a.count,
      }))
    );
  })
  .catch((error) => {
    console.error("Error in Spotify API sandbox:", error);
  });
