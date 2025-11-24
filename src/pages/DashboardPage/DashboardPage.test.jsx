import { render, screen, within } from '@testing-library/react';
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

describe('DashboardPage', () => {
  test('success: displays both cards, images, links and title', async () => {
    renderDashboard();
    const artistCard = await screen.findByTestId('top-artist-card');
    const trackCard = await screen.findByTestId('top-track-card');
    expect(document.title).toBe(buildTitle('Dashboard'));

    const artistImg = within(artistCard).getByRole('img', { name: artistOk.name });
    const trackImg = within(trackCard).getByRole('img', { name: trackOk.name });
    expect(artistImg).toHaveAttribute('src', artistOk.images[0].url);
    expect(trackImg).toHaveAttribute('src', trackOk.album.images[0].url);

    const artistLink = within(artistCard).getByRole('link');
    const trackLink = within(trackCard).getByRole('link');
    expect(artistLink).toHaveAttribute('href', artistOk.external_urls.spotify);
    expect(trackLink).toHaveAttribute('href', trackOk.external_urls.spotify);
  });

  test('artist error only', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ data: null, error: 'Artist error' });
    renderDashboard();
    const artistErr = await screen.findByTestId('dashboard-artists-error');
    expect(artistErr).toBeInTheDocument();
    expect(artistErr).toHaveTextContent('Artist error');
    const trackCard = await screen.findByTestId('top-track-card');
    expect(trackCard).toBeInTheDocument();
    expect(screen.queryByTestId('top-artist-card')).not.toBeInTheDocument();
  });

  test('track error only', async () => {
    fetchUserTopTracks.mockResolvedValueOnce({ data: null, error: 'Track error' });
    renderDashboard();
    const trackErr = await screen.findByTestId('dashboard-tracks-error');
    expect(trackErr).toBeInTheDocument();
    expect(trackErr).toHaveTextContent('Track error');
    const artistCard = await screen.findByTestId('top-artist-card');
    expect(artistCard).toBeInTheDocument();
    expect(screen.queryByTestId('top-track-card')).not.toBeInTheDocument();
  });

  test('both errors', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ data: null, error: 'Artist fail' });
    fetchUserTopTracks.mockResolvedValueOnce({ data: null, error: 'Track fail' });
    renderDashboard();
    const artistErr = await screen.findByTestId('dashboard-artists-error');
    const trackErr = await screen.findByTestId('dashboard-tracks-error');
    expect(artistErr).toHaveTextContent('Artist fail');
    expect(trackErr).toHaveTextContent('Track fail');
    expect(screen.queryByTestId('top-artist-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('top-track-card')).not.toBeInTheDocument();
  });

  test('catch: both rejects set same error', async () => {
    const rejection = new Error('Network down');
    fetchUserTopArtists.mockRejectedValueOnce(rejection);
    fetchUserTopTracks.mockRejectedValueOnce(rejection);
    renderDashboard();
    const artistErr = await screen.findByTestId('dashboard-artists-error');
    const trackErr = await screen.findByTestId('dashboard-tracks-error');
    expect(artistErr).toHaveTextContent('Network down');
    expect(trackErr).toHaveTextContent('Network down');
  });

  test('empty arrays: no cards, no errors', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ data: { items: [] }, error: null });
    fetchUserTopTracks.mockResolvedValueOnce({ data: { items: [] }, error: null });
    renderDashboard();
    // Wait until either error or card would appear; use subtitle as stable element
    await screen.findByText(/Your top artist and track/i);
    expect(screen.queryByTestId('top-artist-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('top-track-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-artists-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-tracks-error')).not.toBeInTheDocument();
  });

  test('fallback subtitles when data missing', async () => {
    const noGenreArtist = { ...artistOk, genres: [] };
    const noArtistTrack = { ...trackOk, artists: [] };
    fetchUserTopArtists.mockResolvedValueOnce({ data: { items: [noGenreArtist] }, error: null });
    fetchUserTopTracks.mockResolvedValueOnce({ data: { items: [noArtistTrack] }, error: null });
    renderDashboard();
    const artistCard = await screen.findByTestId('top-artist-card');
    const trackCard = await screen.findByTestId('top-track-card');
    const artistSubtitle = within(artistCard).getByTestId('subtitle');
    const trackSubtitle = within(trackCard).getByTestId('subtitle');
    expect(artistSubtitle).toHaveTextContent('Genres inconnus');
    expect(trackSubtitle).toHaveTextContent('Artistes inconnus');
  });

  test('abort: unmount before promises resolve prevents error set', async () => {
    jest.useFakeTimers();
    fetchUserTopArtists.mockImplementationOnce(() =>
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Late A')), 15))
    );
    fetchUserTopTracks.mockImplementationOnce(() =>
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Late T')), 20))
    );
    const { unmount } = renderDashboard();
    unmount();
    jest.advanceTimersByTime(25);
    // Component unmounted: errors should not appear
    expect(screen.queryByTestId('dashboard-artists-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-tracks-error')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test('no token: effect short-circuits (fetches never called)', async () => {
    useRequireToken.mockReturnValueOnce({ token: null });
    renderDashboard();
    // Subtitle still renders
    await screen.findByText(/Your top artist and track/i);
    expect(fetchUserTopArtists).not.toHaveBeenCalled();
    expect(fetchUserTopTracks).not.toHaveBeenCalled();
    // Loading should still show (no token triggers return)
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });
});