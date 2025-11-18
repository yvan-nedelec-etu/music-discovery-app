import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import DashboardPage from './DashboardPage.jsx';
import * as topApi from '../../api/spotify-top.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';

function setup() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const mockArtist = {
  id: 'a1',
  name: 'Artist One',
  images: [{ url: 'https://example.com/a1.jpg' }],
  genres: ['rock', 'pop', 'indie']
};

const mockTrack = {
  id: 't1',
  name: 'Track One',
  album: { images: [{ url: 'https://example.com/t1.jpg' }] },
  artists: [{ id: 'a1', name: 'Artist One' }]
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(k =>
      k === KEY_ACCESS_TOKEN ? 'token123' : null
    );
    jest.spyOn(topApi, 'fetchUserTopArtists').mockResolvedValue({
      data: { items: [mockArtist] },
      error: null
    });
    jest.spyOn(topApi, 'fetchUserTopTracks').mockResolvedValue({
      data: { items: [mockTrack] },
      error: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders top artist and top track cards', async () => {
    setup();
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('top-artist-card')).toHaveTextContent(mockArtist.name);
    expect(screen.getByTestId('top-track-card')).toHaveTextContent(mockTrack.name);
  });

  test('shows artist error only', async () => {
    topApi.fetchUserTopArtists.mockResolvedValueOnce({ data: null, error: 'Artist error' });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-artists-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('dashboard-artists-error')).toHaveTextContent('Artist error');
    expect(screen.getByTestId('top-track-card')).toBeInTheDocument();
  });

  test('shows track error only', async () => {
    topApi.fetchUserTopTracks.mockResolvedValueOnce({ data: null, error: 'Track error' });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tracks-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('dashboard-tracks-error')).toHaveTextContent('Track error');
    expect(screen.getByTestId('top-artist-card')).toBeInTheDocument();
  });

  test('handles both errors', async () => {
    topApi.fetchUserTopArtists.mockResolvedValueOnce({ data: null, error: 'Artist error' });
    topApi.fetchUserTopTracks.mockResolvedValueOnce({ data: null, error: 'Track error' });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-artists-error')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-tracks-error')).toBeInTheDocument();
    });
  });
});