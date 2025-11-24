import { Link } from 'react-router-dom';
import './PlayListItem.css';

/**
 * Playlist item component
 * @param {*}  playlist 
 * @returns JSX.Element
 */
export default function PlayListItem({ playlist }) {
  if (!playlist) return null;

  const coverImage = playlist.images?.[0]?.url;
  const playlistName = playlist.name || 'Untitled';
  const ownerName = playlist.owner?.display_name || 'Unknown';
  const trackCount = playlist.tracks?.total || 0;
  const spotifyUrl = playlist.external_urls?.spotify || '#';

  return (
    <li className="list-item playlist-item" data-testid={`playlist-item-${playlist.id}`}>
      <Link to={`/playlist/${playlist.id}`} className="playlist-item-link">
        {coverImage ? (
          <img src={coverImage} alt={`${playlistName} cover`} className="playlist-item-cover" />
        ) : (
          <div className="playlist-item-cover-placeholder" aria-label="No cover image" />
        )}
        <div className="playlist-item-details">
          <div className="playlist-item-details-header">
            <div className="playlist-item-title">{playlistName}</div>
            <div className="playlist-item-owner">By {ownerName}</div>
          </div>
          <div className="playlist-item-tracks">
            {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
          </div>
        </div>
      </Link>
      <a
        className="playlist-link"
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        Open
      </a>
    </li>
  );
}