import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistPage from './PlaylistPage.jsx';
import * as spotifyApi from '../../api/spotify-playlists.js';
import * as handleTokenErrorModule from '../../utils/handleTokenError.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';

const basePlaylist = {
  id: 'playlist1',
  name: 'My Playlist 1',
  description: 'A cool playlist',
  images: [{ url: 'https://via.placeholder.com/56' }],
  owner: { display_name: 'User1' },
  external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' },
  tracks: {
    total: 2,
    items: [
      {
        track: {
          id: 'track1',
          name: 'Track One',
          artists: [{ name: 'Artist A' }],
          album: { name: 'Album X', images: [{ url: 'https://via.placeholder.com/56' }] },
          duration_ms: 210000,
          external_urls: { spotify: 'https://open.spotify.com/track/track1' }
        }
      },
      {
        track: {
          id: 'track2',
          name: 'Second Song',
          artists: [{ name: 'Artist B' }],
          album: { name: 'Album Y', images: [{ url: 'https://via.placeholder.com/56' }] },
          duration_ms: 180000,
          external_urls: { spotify: 'https://open.spotify.com/track/track2' }
        }
      }
    ]
  }
};

describe('PlaylistPage', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(k => k === KEY_ACCESS_TOKEN ? 'test-token' : null);
    jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({ data: basePlaylist, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderPage = (id = 'playlist1') =>
    render(
      <MemoryRouter initialEntries={[`/playlist/${id}`]}>
        <Routes>
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

  const finishLoading = async () => {
    await screen.findByTestId('loading-indicator');
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
  };

  test('loads and renders playlist', async () => {
    renderPage();
    expect(document.title).toBe(buildTitle('Playlist'));
    await finishLoading();
    expect(document.title).toBe(buildTitle(basePlaylist.name));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(basePlaylist.name);
    expect(screen.getByAltText(`${basePlaylist.name} cover`)).toBeInTheDocument();
    expect(screen.getByText(/A cool playlist/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Play on Spotify/i })).toHaveAttribute('href', basePlaylist.external_urls.spotify);
    expect(screen.getByTestId('track-item-track1')).toBeInTheDocument();
    expect(screen.getByTestId('track-item-track2')).toBeInTheDocument();
  });

  test('search filters tracks by name', async () => {
    renderPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-track-search');
    await userEvent.clear(input);
    await userEvent.type(input, 'second');
    expect(screen.getByTestId('track-item-track2')).toBeInTheDocument();
    expect(screen.queryByTestId('track-item-track1')).not.toBeInTheDocument();
  });

  test('search filters tracks by artist', async () => {
    renderPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-track-search');
    await userEvent.type(input, 'Artist A');
    expect(screen.getByTestId('track-item-track1')).toBeInTheDocument();
    expect(screen.queryByTestId('track-item-track2')).not.toBeInTheDocument();
  });

  test('shows no-results message then clears', async () => {
    renderPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-track-search');
    await userEvent.type(input, 'zzzz');
    expect(screen.getByTestId('playlist-tracks-no-results')).toBeInTheDocument();
    await userEvent.clear(input);
    expect(screen.queryByTestId('playlist-tracks-no-results')).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/track-item-/)).toHaveLength(2);
  });

  test('clear button resets search', async () => {
    renderPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-track-search');
    await userEvent.type(input, 'track one');
    const clearBtn = screen.getByRole('button', { name: /clear track search/i });
    await userEvent.click(clearBtn);
    expect(input.value).toBe('');
    expect(screen.getAllByTestId(/track-item-/)).toHaveLength(2);
  });

  test('handles API error', async () => {
    spotifyApi.fetchPlaylistById.mockResolvedValueOnce({ data: null, error: 'Failed to fetch playlist' });
    renderPage();
    await finishLoading();
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch playlist');
  });

  test('handles rejection', async () => {
    spotifyApi.fetchPlaylistById.mockRejectedValueOnce(new Error('API error occurred'));
    renderPage();
    await finishLoading();
    expect(screen.getByRole('alert')).toHaveTextContent('API error occurred');
  });

  test('token expiry triggers handleTokenError', async () => {
    const spy = jest.spyOn(handleTokenErrorModule, 'handleTokenError');
    spotifyApi.fetchPlaylistById.mockResolvedValueOnce({ data: null, error: 'The access token expired' });
    renderPage();
    await finishLoading();
    expect(spy).toHaveBeenCalledWith('The access token expired', expect.any(Function));
  });

  test('empty playlist shows empty message', async () => {
    const empty = { ...basePlaylist, tracks: { total: 0, items: [] } };
    spotifyApi.fetchPlaylistById.mockResolvedValueOnce({ data: empty, error: null });
    renderPage();
    await finishLoading();
    expect(screen.getByText('This playlist is empty')).toBeInTheDocument();
  });

  test('filters out invalid items', async () => {
    const mixed = {
      ...basePlaylist,
      tracks: {
        total: 4,
        items: [
          basePlaylist.tracks.items[0],
          basePlaylist.tracks.items[1],
          { added_at: 'x', track: null },
          { added_at: 'y' }
        ]
      }
    };
    spotifyApi.fetchPlaylistById.mockResolvedValueOnce({ data: mixed, error: null });
    renderPage();
    await finishLoading();
    expect(screen.getByTestId('track-item-track1')).toBeInTheDocument();
    expect(screen.getByTestId('track-item-track2')).toBeInTheDocument();
    expect(screen.getAllByTestId(/track-item-/)).toHaveLength(2);
  });
});