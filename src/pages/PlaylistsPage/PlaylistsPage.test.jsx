import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistsPage, { limit } from './PlaylistsPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';

const playlistsData = {
  items: [
    { id: 'playlist1', name: 'Focus Mix', images: [{ url: 'x' }], owner: { display_name: 'User1' }, tracks: { total: 5 }, external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' } },
    { id: 'playlist2', name: 'Daily Drive', images: [{ url: 'x' }], owner: { display_name: 'User2' }, tracks: { total: 10 }, external_urls: { spotify: 'https://open.spotify.com/playlist/playlist2' } },
  ],
  total: 2
};

const tokenValue = 'test-token';

describe('PlaylistsPage', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(k => k === KEY_ACCESS_TOKEN ? tokenValue : null);
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({ data: playlistsData, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderPlaylistsPage = () =>
    render(
      <MemoryRouter initialEntries={['/playlists']}>
        <Routes>
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

  const finishLoading = async () => {
    await screen.findByTestId('loading-indicator');
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
  };

  test('renders playlists and updates title', async () => {
    renderPlaylistsPage();
    expect(document.title).toBe(buildTitle('Playlists'));
    await finishLoading();
    expect(spotifyApi.fetchUserPlaylists).toHaveBeenCalledWith(
      tokenValue,
      limit,
      expect.objectContaining({ signal: expect.any(Object) })
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Your Playlists/);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 playlists of 2');
    expect(screen.getByTestId('playlist-item-playlist1')).toBeInTheDocument();
    expect(screen.getByTestId('playlist-item-playlist2')).toBeInTheDocument();
  });

  test('search filters playlists live (Focus)', async () => {
    renderPlaylistsPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-search');
    await userEvent.clear(input);
    await userEvent.type(input, 'focus');
    const items = screen.getAllByTestId(/playlist-item-/);
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(/Focus Mix/i);
  });

  test('search filters playlists live (Daily)', async () => {
    renderPlaylistsPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-search');
    await userEvent.clear(input);
    await userEvent.type(input, 'daily');
    const items = screen.getAllByTestId(/playlist-item-/);
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(/Daily Drive/i);
  });

  test('search shows no-results message', async () => {
    renderPlaylistsPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-search');
    await userEvent.type(input, 'zzz');
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(screen.queryByTestId('playlist-item-playlist1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('playlist-item-playlist2')).not.toBeInTheDocument();
  });

  test('clearing search restores all playlists', async () => {
    renderPlaylistsPage();
    await finishLoading();
    const input = screen.getByTestId('playlist-search');
    await userEvent.type(input, 'daily');
    expect(screen.getAllByTestId(/playlist-item-/)).toHaveLength(1);
    await userEvent.clear(input);
    expect(screen.getAllByTestId(/playlist-item-/)).toHaveLength(2);
  });

  test('handles API error', async () => {
    spotifyApi.fetchUserPlaylists.mockResolvedValueOnce({ data: { items: [], total: 0 }, error: 'Failed to fetch playlists' });
    renderPlaylistsPage();
    await finishLoading();
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch playlists');
  });

  test('handles API rejection', async () => {
    spotifyApi.fetchUserPlaylists.mockRejectedValueOnce(new Error('Network error'));
    renderPlaylistsPage();
    await finishLoading();
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });

  test('redirects on expired token', async () => {
    spotifyApi.fetchUserPlaylists.mockResolvedValueOnce({ data: null, error: 'The access token expired' });
    renderPlaylistsPage();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  test('filters out null items', async () => {
    spotifyApi.fetchUserPlaylists.mockResolvedValueOnce({
      data: { items: [playlistsData.items[0], null, playlistsData.items[1], undefined], total: 4 },
      error: null
    });
    renderPlaylistsPage();
    await finishLoading();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 playlists of 4');
  });
});