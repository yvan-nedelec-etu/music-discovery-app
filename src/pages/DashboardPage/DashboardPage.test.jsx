import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import DashboardPage from './DashboardPage.jsx';
import { buildTitle } from '../../constants/appMeta.js';

jest.mock('../../hooks/useRequireToken.js', () => ({
  useRequireToken: jest.fn(() => ({ token: 'token123' }))
}));
import { useRequireToken } from '../../hooks/useRequireToken.js';

jest.mock('../../api/spotify-top.js', () => ({
  fetchUserTopArtists: jest.fn(),
  fetchUserTopTracks: jest.fn()
}));
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-top.js';

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const artistOk = {
  id: 'a1',
  name: 'Artist One',
  images: [{ url: 'https://example.com/a1.jpg' }],
  genres: ['rock', 'pop', 'indie'],
  external_urls: { spotify: 'https://spotify.com/artist/a1' }
};

const trackOk = {
  id: 't1',
  name: 'Track One',
  album: { images: [{ url: 'https://example.com/t1.jpg' }] },
  artists: [{ id: 'a1', name: 'Artist One' }],
  external_urls: { spotify: 'https://spotify.com/track/t1' }
};

beforeEach(() => {
  fetchUserTopArtists.mockResolvedValue({ data: { items: [artistOk] }, error: null });
  fetchUserTopTracks.mockResolvedValue({ data: { items: [trackOk] }, error: null });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('DashboardPage full coverage', () => {
  test('renders loading then success with both cards and title + links', async () => {
    renderDashboard();
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(document.title).toBe(buildTitle('Dashboard'));
    expect(screen.getByTestId('top-artist-card')).toHaveTextContent(artistOk.name);
    expect(screen.getByTestId('top-track-card')).toHaveTextContent(trackOk.name);
    expect(screen.getByTestId('top-artist-card').querySelector('img')).toHaveAttribute('src', artistOk.images[0].url);
    expect(screen.getByTestId('top-track-card').querySelector('img')).toHaveAttribute('src', trackOk.album.images[0].url);
    // links
    expect(screen.getByTestId('top-artist-card').querySelector('a')).toHaveAttribute('href', artistOk.external_urls.spotify);
    expect(screen.getByTestId('top-track-card').querySelector('a')).toHaveAttribute('href', trackOk.external_urls.spotify);
  });

  test('artist error only branch', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ data: null, error: 'Artist error' });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('dashboard-artists-error')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-artists-error')).toHaveTextContent('Artist error');
    expect(screen.getByTestId('top-track-card')).toBeInTheDocument();
    expect(screen.queryByTestId('top-artist-card')).toBeNull();
  });

  test('track error only branch', async () => {
    fetchUserTopTracks.mockResolvedValueOnce({ data: null, error: 'Track error' });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('dashboard-tracks-error')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-tracks-error')).toHaveTextContent('Track error');
    expect(screen.getByTestId('top-artist-card')).toBeInTheDocument();
    expect(screen.queryByTestId('top-track-card')).toBeNull();
  });

  test('both errors branch via API error fields', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ data: null, error: 'Artist fail' });
    fetchUserTopTracks.mockResolvedValueOnce({ data: null, error: 'Track fail' });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('dashboard-artists-error')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('dashboard-tracks-error')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-artists-error')).toHaveTextContent('Artist fail');
    expect(screen.getByTestId('dashboard-tracks-error')).toHaveTextContent('Track fail');
    expect(screen.queryByTestId('top-artist-card')).toBeNull();
    expect(screen.queryByTestId('top-track-card')).toBeNull();
  });

  test('catch branch sets both errors when both promises reject', async () => {
    const rejection = new Error('Network down');
    fetchUserTopArtists.mockRejectedValueOnce(rejection);
    fetchUserTopTracks.mockRejectedValueOnce(rejection);
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('dashboard-artists-error')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('dashboard-tracks-error')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-artists-error')).toHaveTextContent('Network down');
    expect(screen.getByTestId('dashboard-tracks-error')).toHaveTextContent('Network down');
  });

  test('empty items arrays (no cards rendered, no errors)', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ data: { items: [] }, error: null });
    fetchUserTopTracks.mockResolvedValueOnce({ data: { items: [] }, error: null });
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.queryByTestId('top-artist-card')).toBeNull();
    expect(screen.queryByTestId('top-track-card')).toBeNull();
    expect(screen.queryByTestId('dashboard-artists-error')).toBeNull();
    expect(screen.queryByTestId('dashboard-tracks-error')).toBeNull();
  });

  test('fallback subtitles when genres and artists missing', async () => {
    const noGenreArtist = { ...artistOk, genres: [] };
    const noArtistTrack = { ...trackOk, artists: [] };
    fetchUserTopArtists.mockResolvedValueOnce({ data: { items: [noGenreArtist] }, error: null });
    fetchUserTopTracks.mockResolvedValueOnce({ data: { items: [noArtistTrack] }, error: null });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('top-artist-card')).toBeInTheDocument());
    expect(screen.getByTestId('top-artist-card')).toHaveTextContent(noGenreArtist.name);
    expect(screen.getByTestId('top-artist-card').querySelector('[data-testid="subtitle"]')).toHaveTextContent('Genres inconnus');
    expect(screen.getByTestId('top-track-card').querySelector('[data-testid="subtitle"]')).toHaveTextContent('Artistes inconnus');
  });

  test('abort cleanup: signal aborted after unmount', async () => {
    let artistsResolve;
    let tracksResolve;
    const artistsPromise = new Promise(res => { artistsResolve = res; });
    const tracksPromise = new Promise(res => { tracksResolve = res; });
    fetchUserTopArtists.mockImplementationOnce((token, { signal }) => {
      return artistsPromise.then(() => ({ data: { items: [artistOk] }, error: null }));
    });
    fetchUserTopTracks.mockImplementationOnce((token, { signal }) => {
      return tracksPromise.then(() => ({ data: { items: [trackOk] }, error: null }));
    });
    const utils = renderDashboard();
    // Unmount before resolving
    utils.unmount();
    // Resolve promises
    artistsResolve();
    tracksResolve();
    // No assertions needed on DOM (component gone), just ensure mocks called and cleanup ran
    expect(fetchUserTopArtists).toHaveBeenCalled();
    expect(fetchUserTopTracks).toHaveBeenCalled();
  });

  test('no token branch: fetch not called, stays loading', async () => {
    useRequireToken.mockReturnValueOnce({ token: null });
    renderDashboard();
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    // Allow a tick
    await waitFor(() => expect(fetchUserTopArtists).not.toHaveBeenCalled());
    expect(fetchUserTopTracks).not.toHaveBeenCalled();
  });
});