import './PlayListItem.css';
import '../ListItem.css';

/**
 * Playlist item component
 * @param {*}  playlist 
 * @returns JSX.Element
 */
export default function PlayListItem({ playlist }) {
  if (!playlist) return null;

  const {
    id,
    name = 'Untitled',
    owner = {},
    tracks = {},
    external_urls = {},
    images
  } = playlist;

  const coverUrl = Array.isArray(images) && images.length > 0 ? images[0]?.url : null;
  const ownerName = owner?.display_name || 'Unknown';
  const tracksTotal = tracks?.total ?? 0;
  const spotifyLink = external_urls?.spotify || '#';

  return (
    <li data-testid={`playlist-item-${id}`} className="list-item playlist-item">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`${name} cover`}
          className="playlist-item-cover"
        />
      ) : (
        <div
          className="playlist-item-cover playlist-item-cover--placeholder"
          aria-label="No cover image"
        />
      )}

      <div className="playlist-item-details">
        <div className="playlist-item-details-header">
          {/* ✅ lien interne attendu par les tests */}
          <a href={`/playlist/${id}`} className="playlist-item-title">
            {name}
          </a>

          <div className="playlist-item-owner">By {ownerName}</div>
        </div>

        <div className="playlist-item-tracks">{tracksTotal} tracks</div>
      </div>

      {/* lien Spotify externe */}
      <a
        href={spotifyLink}
        target="_blank"
        rel="noopener noreferrer"
        className="playlist-link"
      >
        Open
      </a>
    </li>
  );
}
