import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlayListItem from './PlayListItem';

const renderWithRouter = (ui) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PlayListItem component', () => {
  test('renders playlist information correctly', () => {
    const playlist = {
      id: 'playlist1',
      name: 'Test Playlist',
      images: [{ url: 'test.jpg' }],
      owner: { display_name: 'Test Owner' },
      tracks: { total: 15 },
      external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
    };

    renderWithRouter(<PlayListItem playlist={playlist} />);

    expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
    expect(screen.getByAltText(`${playlist.name} cover`)).toHaveAttribute('src', playlist.images[0].url);
    expect(screen.getByText(playlist.name)).toBeInTheDocument();
    expect(screen.getByText(`By ${playlist.owner.display_name}`)).toBeInTheDocument();
    expect(screen.getByText(`${playlist.tracks.total} tracks`)).toBeInTheDocument();

    const detailLink = screen.getByRole('link', { name: playlist.name });
    expect(detailLink).toHaveAttribute('href', `/playlist/${playlist.id}`);

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
    const playlist = { id: 'playlist4' };

    renderWithRouter(<PlayListItem playlist={playlist} />);

    expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();

    const detailLink = screen.getByRole('link', { name: 'Untitled' });
    expect(detailLink).toHaveAttribute('href', `/playlist/${playlist.id}`);

    const spotifyLink = screen.getByRole('link', { name: 'Open' });
    expect(spotifyLink).toHaveAttribute('href', '#');

    expect(screen.getByText('By Unknown')).toBeInTheDocument();
    expect(screen.getByText('0 tracks')).toBeInTheDocument();
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
});
