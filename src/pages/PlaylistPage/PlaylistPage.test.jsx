import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistPage from './PlaylistPage.jsx';
import * as spotifyPlaylists from '../../api/spotify-playlists.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';

// Mock playlist data
const mockPlaylist = {
    id: 'playlist1',
    name: 'Test Playlist',
    description: 'A test playlist description',
    images: [{ url: 'https://via.placeholder.com/250' }],
    owner: { display_name: 'Test User' },
    tracks: {
        total: 3,
        items: [
            {
                track: {
                    id: 'track1',
                    name: 'Track 1',
                    artists: [{ id: 'artist1', name: 'Artist 1' }],
                    album: {
                        name: 'Album 1',
                        images: [{ url: 'https://via.placeholder.com/64' }]
                    },
                    duration_ms: 180000,
                    external_urls: { spotify: 'https://open.spotify.com/track/track1' }
                }
            },
            {
                track: {
                    id: 'track2',
                    name: 'Track 2',
                    artists: [{ id: 'artist2', name: 'Artist 2' }],
                    album: {
                        name: 'Album 2',
                        images: [{ url: 'https://via.placeholder.com/64' }]
                    },
                    duration_ms: 200000,
                    external_urls: { spotify: 'https://open.spotify.com/track/track2' }
                }
            },
            {
                track: {
                    id: 'track3',
                    name: 'Track 3',
                    artists: [{ id: 'artist3', name: 'Artist 3' }],
                    album: {
                        name: 'Album 3',
                        images: [{ url: 'https://via.placeholder.com/64' }]
                    },
                    duration_ms: 220000,
                    external_urls: { spotify: 'https://open.spotify.com/track/track3' }
                }
            }
        ]
    },
    external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
};

const tokenValue = 'test-token';

describe('PlaylistPage', () => {
    beforeEach(() => {
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => 
            key === KEY_ACCESS_TOKEN ? tokenValue : null
        );
        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({ 
            data: mockPlaylist, 
            error: null 
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const renderPlaylistPage = (playlistId = 'playlist1') => {
        return render(
            <MemoryRouter initialEntries={[`/playlist/${playlistId}`]}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    const waitForLoadingToFinish = async () => {
        expect(screen.getByTestId('loading-indicator')).toHaveTextContent(/loading playlist/i);
        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });
    };

    test('renders playlist page with all information', async () => {
        renderPlaylistPage();

        expect(document.title).toBe(buildTitle('Playlist'));

        await waitForLoadingToFinish();

        expect(spotifyPlaylists.fetchPlaylistById).toHaveBeenCalledWith(
            tokenValue,
            'playlist1',
            expect.objectContaining({ signal: expect.any(Object) })
        );

        expect(document.title).toBe(buildTitle(mockPlaylist.name));

        const heading = screen.getByRole('heading', { level: 1, name: mockPlaylist.name });
        expect(heading).toBeInTheDocument();

        expect(screen.getByText(mockPlaylist.description)).toBeInTheDocument();

        const coverImage = screen.getByAltText(`${mockPlaylist.name} cover`);
        expect(coverImage).toHaveAttribute('src', mockPlaylist.images[0].url);

        expect(screen.getByText(`By ${mockPlaylist.owner.display_name}`)).toBeInTheDocument();
        expect(screen.getByText(`${mockPlaylist.tracks.total} tracks`)).toBeInTheDocument();

        const playButton = screen.getByRole('link', { name: /play on spotify/i });
        expect(playButton).toHaveAttribute('href', mockPlaylist.external_urls.spotify);
        expect(playButton).toHaveAttribute('target', '_blank');

        const tracksHeading = screen.getByRole('heading', { level: 2, name: 'Tracks' });
        expect(tracksHeading).toBeInTheDocument();

        mockPlaylist.tracks.items.forEach(item => {
            expect(screen.getByTestId(`track-item-${item.track.id}`)).toBeInTheDocument();
        });
    });

    test('displays loading indicator while fetching', () => {
        renderPlaylistPage();

        const loadingIndicator = screen.getByTestId('loading-indicator');
        expect(loadingIndicator).toHaveTextContent(/loading playlist/i);
    });

    test('displays error message on fetch error', async () => {
        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: null,
            error: 'Failed to fetch playlist'
        });

        renderPlaylistPage();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('Failed to fetch playlist');
    });

    test('displays error message on network failure', async () => {
        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockRejectedValue(
            new Error('Network error')
        );

        renderPlaylistPage();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('Network error');
    });

    test('redirects to login on token expiration', async () => {
        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: null,
            error: 'The access token expired'
        });

        renderPlaylistPage();

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });
    });

    test('displays message when playlist not found', async () => {
        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: null,
            error: null
        });

        renderPlaylistPage();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Playlist not found')).toBeInTheDocument();
    });

    test('displays empty playlist message when no tracks', async () => {
        const emptyPlaylist = {
            ...mockPlaylist,
            tracks: { total: 0, items: [] }
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: emptyPlaylist,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.getByText('This playlist is empty')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { level: 2, name: 'Tracks' })).not.toBeInTheDocument();
    });

    test('handles playlist without cover image', async () => {
        const playlistWithoutImage = {
            ...mockPlaylist,
            images: []
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutImage,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.queryByAltText(`${mockPlaylist.name} cover`)).not.toBeInTheDocument();
    });

    test('handles playlist without description', async () => {
        const playlistWithoutDescription = {
            ...mockPlaylist,
            description: null
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutDescription,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.queryByText(mockPlaylist.description)).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('handles playlist with null track items', async () => {
        const playlistWithNullTracks = {
            ...mockPlaylist,
            tracks: {
                total: 3,
                items: [
                    mockPlaylist.tracks.items[0],
                    null,
                    { track: null },
                    mockPlaylist.tracks.items[1]
                ]
            }
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithNullTracks,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.getByTestId('track-item-track1')).toBeInTheDocument();
        expect(screen.getByTestId('track-item-track2')).toBeInTheDocument();
        expect(screen.queryByTestId('track-item-track3')).not.toBeInTheDocument();
    });

    test('handles missing owner display name', async () => {
        const playlistWithoutOwner = {
            ...mockPlaylist,
            owner: { display_name: null }
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutOwner,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.getByText('By Unknown')).toBeInTheDocument();
    });

    test('aborts fetch when component unmounts', async () => {
        const mockFetch = jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({ data: mockPlaylist, error: null }), 100))
        );

        const { unmount } = renderPlaylistPage();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            tokenValue,
            'playlist1',
            expect.objectContaining({ signal: expect.any(Object) })
        );

        unmount();

        await new Promise(resolve => setTimeout(resolve, 150));
    });

    test('does not fetch when token is missing', () => {
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(null);

        renderPlaylistPage();

        expect(spotifyPlaylists.fetchPlaylistById).not.toHaveBeenCalled();
    });

    test('uses playlist ID from URL params', async () => {
        renderPlaylistPage('custom-playlist-id');

        await waitFor(() => {
            expect(spotifyPlaylists.fetchPlaylistById).toHaveBeenCalledWith(
                tokenValue,
                'custom-playlist-id',
                expect.objectContaining({ signal: expect.any(Object) })
            );
        });
    });

    test('handles playlist without external URL', async () => {
        const playlistWithoutUrl = {
            ...mockPlaylist,
            external_urls: null
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutUrl,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.queryByRole('link', { name: /play on spotify/i })).not.toBeInTheDocument();
    });
        test('handles playlist without external URL', async () => {
        const playlistWithoutUrl = {
            ...mockPlaylist,
            external_urls: null
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithoutUrl,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        expect(screen.queryByRole('link', { name: /play on spotify/i })).not.toBeInTheDocument();
    });

    test('does not set error when abort signal is triggered in catch block', async () => {
        let rejectFn;
        const promise = new Promise((_, reject) => {
            rejectFn = reject;
        });

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockReturnValue(promise);

        const { unmount } = renderPlaylistPage();

        // Wait for the call to be made
        await waitFor(() => {
            expect(spotifyPlaylists.fetchPlaylistById).toHaveBeenCalled();
        });

        // Unmount to trigger abort
        unmount();

        // Reject after unmount to trigger the catch block with aborted signal
        rejectFn(new Error('Request aborted'));

        await new Promise(resolve => setTimeout(resolve, 50));

        // Error should not be displayed because component was unmounted
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('filters out items without track property', async () => {
        const playlistWithMixedItems = {
            ...mockPlaylist,
            tracks: {
                total: 5,
                items: [
                    mockPlaylist.tracks.items[0],
                    { added_at: '2023-01-01', track: null }, // No track
                    mockPlaylist.tracks.items[1],
                    { added_at: '2023-01-02' }, // Missing track property
                    mockPlaylist.tracks.items[2]
                ]
            }
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithMixedItems,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        // Only 3 tracks should be rendered (items with valid track objects)
        expect(screen.getByTestId('track-item-track1')).toBeInTheDocument();
        expect(screen.getByTestId('track-item-track2')).toBeInTheDocument();
        expect(screen.getByTestId('track-item-track3')).toBeInTheDocument();

        // Should have exactly 3 track items
        const trackList = screen.getByRole('list');
        expect(trackList.children).toHaveLength(3);
    });

    test('handles playlist with null or undefined tracks items array', async () => {
        const playlistWithNullItems = {
            ...mockPlaylist,
            tracks: {
                total: 0,
                items: null
            }
        };

        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockResolvedValue({
            data: playlistWithNullItems,
            error: null
        });

        renderPlaylistPage();

        await waitForLoadingToFinish();

        // Should display empty playlist message
        expect(screen.getByText('This playlist is empty')).toBeInTheDocument();
    });

    test('handles error without message property', async () => {
        jest.spyOn(spotifyPlaylists, 'fetchPlaylistById').mockRejectedValue('String error');

        renderPlaylistPage();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('String error');
    });
});