/**
 * Service to count how many times a specific artist appears in a playlist
 */

import { fetchPlaylistById } from '../api/spotify-playlists.js';

/**
 * Counts the number of tracks by a specific artist in a playlist
 * @param {Object} playlist - The playlist object from Spotify API
 * @param {string} artistId - The Spotify ID of the artist to count
 * @returns {number} The number of tracks by the artist in the playlist
 */
export function countArtistInPlaylist(playlist, artistId) {
  if (!playlist || !artistId) {
    return 0;
  }

  // Check if playlist has tracks
  if (!playlist.tracks || !Array.isArray(playlist.tracks.items)) {
    return 0;
  }

  // Count tracks where the artist appears
  return playlist.tracks.items.reduce((count, trackItem) => {
    // Check if track and track.track exist
    if (!trackItem || !trackItem.track) {
      return count;
    }

    const track = trackItem.track;

    // Check if track has artists array
    if (!track.artists || !Array.isArray(track.artists)) {
      return count;
    }

    // Check if any artist in the track matches the artistId
    const hasArtist = track.artists.some(artist => artist.id === artistId);

    return hasArtist ? count + 1 : count;
  }, 0);
}

/**
 * Gets all unique artists from a playlist with their track counts
 * @param {Object} playlist - The playlist object from Spotify API
 * @returns {Array<{id: string, name: string, count: number}>} Array of artists with their appearance counts
 */
export function getArtistCounts(playlist) {
  if (!playlist || !playlist.tracks || !Array.isArray(playlist.tracks.items)) {
    return [];
  }

  const artistMap = new Map();

  playlist.tracks.items.forEach(trackItem => {
    if (!trackItem || !trackItem.track || !trackItem.track.artists) {
      return;
    }

    trackItem.track.artists.forEach(artist => {
      if (!artist || !artist.id) {
        return;
      }

      if (artistMap.has(artist.id)) {
        artistMap.get(artist.id).count++;
      } else {
        artistMap.set(artist.id, {
          id: artist.id,
          name: artist.name,
          count: 1
        });
      }
    });
  });

  // Convert map to array and sort by count (descending)
  return Array.from(artistMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Finds the most frequent artist in a playlist
 * @param {Object} playlist - The playlist object from Spotify API
 * @returns {Object|null} The artist with the most tracks, or null if playlist is empty
 */
export function getMostFrequentArtist(playlist) {
  const artistCounts = getArtistCounts(playlist);
  return artistCounts.length > 0 ? artistCounts[0] : null;
}

/**
 * Fetches a playlist and returns artist appearance counts
 * @param {string} token - Spotify access token
 * @param {string} playlistId - The Spotify playlist ID
 * @returns {Promise<{data: Object, error: string|null}>} Object with artist names as keys and appearance counts as values
 */
export async function artistCountForPlaylist(token, playlistId) {
  try {
    // Validate inputs
    if (!token || typeof token !== 'string') {
      return { data: null, error: 'Invalid token provided' };
    }

    if (!playlistId || typeof playlistId !== 'string') {
      return { data: null, error: 'Invalid playlist ID provided' };
    }

    // Fetch playlist data using existing API
    const response = await fetchPlaylistById(token, playlistId);

    // Check for errors in the response
    if (response.error) {
      return { data: null, error: response.error };
    }

    // Check if playlist data exists
    if (!response.data) {
      return { data: null, error: 'No playlist data received' };
    }

    const playlist = response.data;

    // Get artist counts using helper function
    const artistCounts = getArtistCounts(playlist);

    // Convert array to object with artist name as key and count as value
    const artistCountObject = artistCounts.reduce((acc, artist) => {
      acc[artist.name] = artist.count;
      return acc;
    }, {});

    return { data: artistCountObject, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error.message || 'An error occurred while counting artists' 
    };
  }
}