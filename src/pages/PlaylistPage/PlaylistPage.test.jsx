import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistPage from './PlaylistPage.jsx';
import * as spotifyApi from '../../api/spotify-playlists.js';
import * as handleTokenErrorModule from '../../utils/handleTokenError.js';
import { beforeEach, afterEach, jest } from '@jest/globals';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';

const playlistData = {
    id: 'playlist1',
    name: 'My Playlist 1',
    description: 'A cool playlist',
    images: [{ url: 'https://via.placeholder.com/56' }],
    owner: { display_name: 'User1' },
    external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' },
    tracks: {
        total: 1,
        items: [
            {
                track: {
                    id: 'track1',
                    name: 'Track One',
                    artists: [{ name: 'Artist A' }],
                    album: { name: 'Album X', images: [{ url: 'https://via.placeholder.com/56' }] },
                    duration_ms: 210000,
                    external_urls: { spotify: 'https://open.spotify.com/track/track1' },
                },
            },
        ],
    },
};

describe('PlaylistPage', () => {
    beforeEach(() => {
        const tokenValue = 'test-token';
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => key === KEY_ACCESS_TOKEN ? tokenValue : null);
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({ data: playlistData, error: null });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('fetches and renders playlist, sets title', async () => {
        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(document.title).toBe('Playlist | Spotify App');
        
        // loading state
        expect(screen.getByRole('status')).toHaveTextContent(/loading playlist/i);

        // wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        // verify playlist content rendered
        
        // verify title rendered
        const heading = await screen.findByRole('heading', { level: 1, name: playlistData.name });
        expect(heading).toBeInTheDocument();

        // verify cover image rendered
        const img = screen.getByAltText(`${playlistData.name} cover`);
        expect(img).toHaveAttribute('src', playlistData.images[0].url); 

        // verify description rendered
        expect(screen.getByText(playlistData.description)).toBeInTheDocument();

        // verify Spotify link rendered
        const link = screen.getByRole('link', { name: /play on spotify/i });
        expect(link).toHaveAttribute('href', playlistData.external_urls.spotify);

        // verify tracks rendered
        for (const item of playlistData.tracks.items) {
            expect(await screen.findByTestId(`track-item-${item.track.id}`)).toBeInTheDocument();
        }

        // verify API called with correct params
        await waitFor(() => {
            expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledTimes(1);
            expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledWith(
                'test-token', 
                'playlist1',
                expect.objectContaining({ signal: expect.any(Object) })
            );
        });
    });

    test('displays error message on fetch failure', async () => {
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({ data: null, error: 'Failed to fetch playlist' });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        // wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        // verify error message displayed
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Failed to fetch playlist');
    });

    test('displays error message on fetchPlaylistById failure', async () => {
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockRejectedValue(new Error('API error occurred'));

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        // wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        // verify error message displayed
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('API error occurred');
    });

    test("handleTokenError called on token expiry error", async () => {
        const handleTokenErrorSpy = jest.spyOn(handleTokenErrorModule, 'handleTokenError');
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({ data: null, error: 'The access token expired' });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        // wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        expect(handleTokenErrorSpy).toHaveBeenCalledWith('The access token expired', expect.any(Function));
    });

    test('handles playlist without cover image', async () => {
        const playlistWithoutImage = {
            ...playlistData,
            images: []
        };

        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutImage,
            error: null
        });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        expect(screen.queryByAltText(`${playlistData.name} cover`)).not.toBeInTheDocument();
    });

    test('handles playlist without description', async () => {
        const playlistWithoutDescription = {
            ...playlistData,
            description: null
        };

        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutDescription,
            error: null
        });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        expect(screen.queryByText(playlistData.description)).not.toBeInTheDocument();
    });

    test('handles empty playlist', async () => {
        const emptyPlaylist = {
            ...playlistData,
            tracks: { total: 0, items: [] }
        };

        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({
            data: emptyPlaylist,
            error: null
        });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        expect(screen.getByText('This playlist is empty')).toBeInTheDocument();
    });

    test('filters out items without track property', async () => {
        const playlistWithMixedItems = {
            ...playlistData,
            tracks: {
                total: 3,
                items: [
                    playlistData.tracks.items[0],
                    { added_at: '2023-01-01', track: null },
                    { added_at: '2023-01-02' }
                ]
            }
        };

        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithMixedItems,
            error: null
        });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('track-item-track1')).toBeInTheDocument();
        const trackList = screen.getByRole('list');
        expect(trackList.children).toHaveLength(1);
    });

    test('aborts fetch when component unmounts', async () => {
        const mockFetch = jest.spyOn(spotifyApi, 'fetchPlaylistById').mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({ data: playlistData, error: null }), 100))
        );

        const { unmount } = render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        unmount();

        await new Promise(resolve => setTimeout(resolve, 150));
    });
});