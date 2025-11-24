import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlayListItem from './PlayListItem';

// Helper to render with router
const renderWithRouter = (component) => {
    return render(
        <MemoryRouter>
            {component}
        </MemoryRouter>
    );
};

describe('PlayListItem component', () => {
    test('renders playlist information correctly', () => {
        // Arrange
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };
        // Act
        renderWithRouter(<PlayListItem playlist={playlist} />);

        // Assert
        // items are rendered correctly
        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        // image is rendered correctly
        expect(screen.getByAltText(`${playlist.name} cover`)).toHaveAttribute('src', playlist.images[0].url);
        // text content is rendered correctly
        expect(screen.getByText(playlist.name)).toBeInTheDocument();
        // owner name is rendered correctly
        expect(screen.getByText(`By ${playlist.owner.display_name}`)).toBeInTheDocument();
        // track count is rendered correctly
        expect(screen.getByText(`${playlist.tracks.total} tracks`)).toBeInTheDocument();
        // link to playlist detail page
        const detailLink = screen.getByRole('link', { name: new RegExp(playlist.name) });
        expect(detailLink).toHaveAttribute('href', `/playlist/${playlist.id}`);
        // external spotify link is rendered correctly
        const spotifyLink = screen.getByRole('link', { name: 'Open' });
        expect(spotifyLink).toHaveAttribute('href', playlist.external_urls.spotify);
    });

    test('returns null when playlist is null', () => {
        const { container } = renderWithRouter(<PlayListItem playlist={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders with missing images array', () => {
        const playlist = {
            id: 'playlist2',
            name: 'No Image Playlist',
            images: null,
            owner: { display_name: 'Test Owner' },
            tracks: { total: 5 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist2' }
        };
        renderWithRouter(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByLabelText('No cover image')).toBeInTheDocument();
    });

    test('renders with empty images array', () => {
        const playlist = {
            id: 'playlist3',
            name: 'Empty Images Playlist',
            images: [],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 3 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist3' }
        };
        renderWithRouter(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByLabelText('No cover image')).toBeInTheDocument();
    });

    test('renders with default values when fields are missing', () => {
        const playlist = {
            id: 'playlist4',
        };
        renderWithRouter(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.getByText('Untitled')).toBeInTheDocument();
        expect(screen.getByText('By Unknown')).toBeInTheDocument();
        expect(screen.getByText('0 tracks')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: 'Open' });
        expect(link).toHaveAttribute('href', '#');
    });

    test('renders with partial owner data', () => {
        const playlist = {
            id: 'playlist5',
            name: 'Partial Owner Playlist',
            owner: {},
            tracks: { total: 7 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist5' }
        };
        renderWithRouter(<PlayListItem playlist={playlist} />);

        expect(screen.getByText('By Unknown')).toBeInTheDocument();
    });

    test('returns null when playlist is null', () => {
        const { container } = render(<PlayListItem playlist={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders with missing images array', () => {
        const playlist = {
            id: 'playlist2',
            name: 'No Image Playlist',
            images: null,
            owner: { display_name: 'Test Owner' },
            tracks: { total: 5 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist2' }
        };
        render(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByLabelText('No cover image')).toBeInTheDocument();
    });

    test('renders with empty images array', () => {
        const playlist = {
            id: 'playlist3',
            name: 'Empty Images Playlist',
            images: [],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 3 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist3' }
        };
        render(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByLabelText('No cover image')).toBeInTheDocument();
    });

    test('renders with default values when fields are missing', () => {
        const playlist = {
            id: 'playlist4',
            // name missing - should default to 'Untitled'
            // owner missing - should default to 'Unknown'
            // tracks missing - should default to 0
            // external_urls missing - should default to '#'
        };
        render(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.getByText('Untitled')).toBeInTheDocument();
        expect(screen.getByText('By Unknown')).toBeInTheDocument();
        expect(screen.getByText('0 tracks')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '#');
    });

    test('renders with partial owner data', () => {
        const playlist = {
            id: 'playlist5',
            name: 'Partial Owner Playlist',
            owner: {}, // no display_name
            tracks: { total: 7 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist5' }
        };
        render(<PlayListItem playlist={playlist} />);

        expect(screen.getByText('By Unknown')).toBeInTheDocument();
    });
});