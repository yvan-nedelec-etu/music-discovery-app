import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  countArtistInPlaylist, 
  getArtistCounts, 
  getMostFrequentArtist,
  artistCountForPlaylist 
} from './artist-count-for-playlist.js';
import * as spotifyPlaylists from '../api/spotify-playlists.js';

describe('artist-count-for-playlist service', () => {
  // Mock playlist data
  const mockPlaylist = {
    id: 'playlist1',
    name: 'Test Playlist',
    tracks: {
      items: [
        {
          track: {
            id: 'track1',
            name: 'Track 1',
            artists: [
              { id: 'artist1', name: 'Artist One' },
              { id: 'artist2', name: 'Artist Two' }
            ]
          }
        },
        {
          track: {
            id: 'track2',
            name: 'Track 2',
            artists: [
              { id: 'artist1', name: 'Artist One' }
            ]
          }
        },
        {
          track: {
            id: 'track3',
            name: 'Track 3',
            artists: [
              { id: 'artist3', name: 'Artist Three' }
            ]
          }
        },
        {
          track: {
            id: 'track4',
            name: 'Track 4',
            artists: [
              { id: 'artist1', name: 'Artist One' },
              { id: 'artist3', name: 'Artist Three' }
            ]
          }
        }
      ]
    }
  };

  describe('countArtistInPlaylist', () => {
    test('counts artist appearances correctly', () => {
      expect(countArtistInPlaylist(mockPlaylist, 'artist1')).toBe(3);
      expect(countArtistInPlaylist(mockPlaylist, 'artist2')).toBe(1);
      expect(countArtistInPlaylist(mockPlaylist, 'artist3')).toBe(2);
    });

    test('returns 0 for artist not in playlist', () => {
      expect(countArtistInPlaylist(mockPlaylist, 'artist999')).toBe(0);
    });

    test('returns 0 when playlist is null', () => {
      expect(countArtistInPlaylist(null, 'artist1')).toBe(0);
    });

    test('returns 0 when artistId is null', () => {
      expect(countArtistInPlaylist(mockPlaylist, null)).toBe(0);
    });

    test('returns 0 when playlist has no tracks', () => {
      const emptyPlaylist = { id: 'empty', tracks: { items: [] } };
      expect(countArtistInPlaylist(emptyPlaylist, 'artist1')).toBe(0);
    });

    test('returns 0 when playlist tracks is not an array', () => {
      const invalidPlaylist = { id: 'invalid', tracks: { items: null } };
      expect(countArtistInPlaylist(invalidPlaylist, 'artist1')).toBe(0);
    });

    test('handles null track items gracefully', () => {
      const playlistWithNulls = {
        tracks: {
          items: [
            null,
            { track: { artists: [{ id: 'artist1', name: 'Artist One' }] } },
            { track: null },
            undefined
          ]
        }
      };
      expect(countArtistInPlaylist(playlistWithNulls, 'artist1')).toBe(1);
    });

    test('handles tracks without artists array', () => {
      const playlistWithoutArtists = {
        tracks: {
          items: [
            { track: { id: 'track1', artists: null } },
            { track: { id: 'track2', artists: [{ id: 'artist1', name: 'Artist One' }] } }
          ]
        }
      };
      expect(countArtistInPlaylist(playlistWithoutArtists, 'artist1')).toBe(1);
    });
  });

  describe('getArtistCounts', () => {
    test('returns artist counts sorted by frequency', () => {
      const counts = getArtistCounts(mockPlaylist);
      
      expect(counts).toHaveLength(3);
      expect(counts[0]).toEqual({ id: 'artist1', name: 'Artist One', count: 3 });
      expect(counts[1]).toEqual({ id: 'artist3', name: 'Artist Three', count: 2 });
      expect(counts[2]).toEqual({ id: 'artist2', name: 'Artist Two', count: 1 });
    });

    test('returns empty array for null playlist', () => {
      expect(getArtistCounts(null)).toEqual([]);
    });

    test('returns empty array for playlist without tracks', () => {
      const emptyPlaylist = { id: 'empty' };
      expect(getArtistCounts(emptyPlaylist)).toEqual([]);
    });

    test('returns empty array for playlist with empty tracks', () => {
      const emptyPlaylist = { id: 'empty', tracks: { items: [] } };
      expect(getArtistCounts(emptyPlaylist)).toEqual([]);
    });

    test('handles null track items gracefully', () => {
      const playlistWithNulls = {
        tracks: {
          items: [
            { track: { artists: [{ id: 'artist1', name: 'Artist One' }] } },
            null,
            { track: { artists: [{ id: 'artist1', name: 'Artist One' }] } }
          ]
        }
      };
      const counts = getArtistCounts(playlistWithNulls);
      expect(counts).toHaveLength(1);
      expect(counts[0]).toEqual({ id: 'artist1', name: 'Artist One', count: 2 });
    });

    test('handles artists without id gracefully', () => {
      const playlistWithInvalidArtists = {
        tracks: {
          items: [
            { track: { artists: [{ id: null, name: 'Invalid Artist' }] } },
            { track: { artists: [{ id: 'artist1', name: 'Valid Artist' }] } }
          ]
        }
      };
      const counts = getArtistCounts(playlistWithInvalidArtists);
      expect(counts).toHaveLength(1);
      expect(counts[0]).toEqual({ id: 'artist1', name: 'Valid Artist', count: 1 });
    });
  });

  describe('getMostFrequentArtist', () => {
    test('returns the most frequent artist', () => {
      const mostFrequent = getMostFrequentArtist(mockPlaylist);
      expect(mostFrequent).toEqual({ id: 'artist1', name: 'Artist One', count: 3 });
    });

    test('returns null for empty playlist', () => {
      const emptyPlaylist = { tracks: { items: [] } };
      expect(getMostFrequentArtist(emptyPlaylist)).toBeNull();
    });

    test('returns null for null playlist', () => {
      expect(getMostFrequentArtist(null)).toBeNull();
    });

    test('returns first artist when multiple have same count', () => {
      const tiedPlaylist = {
        tracks: {
          items: [
            { track: { artists: [{ id: 'artist1', name: 'Artist One' }] } },
            { track: { artists: [{ id: 'artist2', name: 'Artist Two' }] } }
          ]
        }
      };
      const mostFrequent = getMostFrequentArtist(tiedPlaylist);
      expect(mostFrequent.count).toBe(1);
      expect(['artist1', 'artist2']).toContain(mostFrequent.id);
    });
  });

  describe('artistCountForPlaylist', () => {
    beforeEach(() => {
      jest.spyOn(spotifyPlaylists, 'fetchPlaylistById');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns artist counts for a valid playlist', async () => {
      spotifyPlaylists.fetchPlaylistById.mockResolvedValue({
        data: mockPlaylist,
        error: null
      });

      const result = await artistCountForPlaylist('test-token', 'playlist1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        'Artist One': 3,
        'Artist Three': 2,
        'Artist Two': 1
      });
      expect(spotifyPlaylists.fetchPlaylistById).toHaveBeenCalledWith('test-token', 'playlist1');
    });

    test('returns error when token is invalid', async () => {
      const result = await artistCountForPlaylist(null, 'playlist1');
      
      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid token provided');
    });

    test('returns error when playlistId is invalid', async () => {
      const result = await artistCountForPlaylist('test-token', null);
      
      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid playlist ID provided');
    });

    test('returns error when API call fails', async () => {
      spotifyPlaylists.fetchPlaylistById.mockResolvedValue({
        data: null,
        error: 'API error'
      });

      const result = await artistCountForPlaylist('test-token', 'playlist1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('API error');
    });

    test('returns error when no playlist data received', async () => {
      spotifyPlaylists.fetchPlaylistById.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await artistCountForPlaylist('test-token', 'playlist1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('No playlist data received');
    });

    test('handles exceptions gracefully', async () => {
      spotifyPlaylists.fetchPlaylistById.mockRejectedValue(new Error('Network error'));

      const result = await artistCountForPlaylist('test-token', 'playlist1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });

    test('returns empty object for playlist with no tracks', async () => {
      const emptyPlaylist = { id: 'empty', tracks: { items: [] } };
      spotifyPlaylists.fetchPlaylistById.mockResolvedValue({
        data: emptyPlaylist,
        error: null
      });

      const result = await artistCountForPlaylist('test-token', 'empty');

      expect(result.error).toBeNull();
      expect(result.data).toEqual({});
    });
  });
});