import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import { buildTitle } from '../../constants/appMeta.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import '../../styles/PlaylistDetailPage.css';
import '../PageLayout.css';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useRequireToken();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = buildTitle('Playlist');
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    const abort = new AbortController();

    fetchPlaylistById(token, id, { signal: abort.signal })
      .then(res => {
        if (abort.signal.aborted) return;
        if (res?.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error);
          }
          setLoading(false);
          return;
        }
        setPlaylist(res.data);
        if (res.data?.name) {
          document.title = buildTitle(res.data.name);
        }
        setLoading(false);
      })
      .catch(err => {
        if (abort.signal.aborted) return;
        setError(err?.message || String(err));
        setLoading(false);
      });

    return () => abort.abort();
  }, [token, id, navigate]);

  // Derivations (unconditional to avoid hook count change)
  const rawItems = playlist?.tracks?.items;
  const trackItems = Array.isArray(rawItems) ? rawItems.filter(it => it && it.track) : [];

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trackItems;
    try {
      return trackItems.filter(it => {
        const name = (it?.track?.name || '').toLowerCase();
        const artistsText = (it?.track?.artists
          ? it.track.artists.map(a => a?.name || '').join(' ')
          : ''
        ).toLowerCase();
        return name.includes(q) || artistsText.includes(q);
      });
    } catch (e) {
      console.error('[playlist] filter error:', e);
      return trackItems;
    }
  }, [trackItems, query]);

  const showNoMatch =
    trackItems.length > 0 &&
    filteredTracks.length === 0 &&
    query.trim().length > 0;

  const coverImage = playlist?.images?.[0]?.url;

  // Render branches (no hooks after this point)
  if (loading) {
    return (
      <div className="playlist-page-container page-container">
        <output className="playlist-loading" data-testid="loading-indicator">
          Loading playlist...
        </output>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-page-container page-container">
        <div className="playlist-error" role="alert">{error}</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-page-container page-container">
        <div className="playlist-empty">Playlist not found</div>
      </div>
    );
  }

  return (
    <section className="playlist-page-container page-container" aria-labelledby="playlist-title">
      <div className="playlist-header">
        {coverImage && (
          <img
            src={coverImage}
            alt={`${playlist.name} cover`}
            className="playlist-cover"
          />
        )}
        <div className="playlist-info">
          <h1 id="playlist-title" className="playlist-title page-title">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p
              className="playlist-description"
              dangerouslySetInnerHTML={{ __html: playlist.description }}
            />
          )}
          <div className="playlist-meta">
            <span className="playlist-meta-item">
              By {playlist.owner?.display_name || 'Unknown'}
            </span>
            <span className="playlist-meta-item">
              {playlist.tracks?.total || 0} tracks
            </span>
          </div>
          {playlist.external_urls?.spotify && (
            <a
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="playlist-play-button"
            >
              Play on Spotify
            </a>
          )}
        </div>
      </div>

      {trackItems.length > 0 && (
        <div
          role="search"
          className="playlist-tracks-search-wrapper"
          aria-label="Search within playlist tracks"
        >
          <label htmlFor="playlist-track-search" className="visually-hidden">
            Search tracks
          </label>
          <input
            id="playlist-track-search"
            type="search"
            className="playlist-tracks-search-input"
            placeholder="Search tracks or artists…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            data-testid="playlist-track-search"
            aria-describedby="playlist-track-search-hint"
          />
          <span className="playlist-tracks-search-icon" aria-hidden="true">🔍</span>
          <small
            id="playlist-track-search-hint"
            className="playlist-tracks-search-hint"
          >
            Live filtering by track name or artist.
          </small>
          {query && (
            <button
              type="button"
              className="playlist-tracks-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear track search"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {trackItems.length > 0 ? (
        <>
          <h2 className="playlist-tracks-title">
            Tracks ({filteredTracks.length}/{trackItems.length})
          </h2>
          {showNoMatch && (
            <p
              className="playlist-tracks-no-results"
              data-testid="playlist-tracks-no-results"
            >
              No matching tracks for “{query}”.
            </p>
          )}
          {!showNoMatch && (
            <ol className="playlist-tracks-list" data-testid="playlist-tracks-list">
              {filteredTracks.map(item => {
                if (!item?.track) return null;
                return (
                  <TrackItem
                    key={item.track.id || item.added_at || Math.random()}
                    track={item.track}
                  />
                );
              })}
            </ol>
          )}
        </>
      ) : (
        <div className="playlist-empty">This playlist is empty</div>
      )}
    </section>
  );
}