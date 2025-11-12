import { useState, useEffect } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import PlayListItem from '../../components/PlayListItem/PlayListItem.jsx';
import { fetchUserPlaylists } from '../../api/spotify-me.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import './PlaylistsPage.css';
import '../PageLayout.css';
import { useNavigate } from 'react-router-dom';

/**
 * Number of playlists to fetch per page
 */
export const limit = 10;

/**
 * Playlists Page
 * @returns {JSX.Element}
 */
export default function PlaylistsPage() {
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [totalPlaylists, setTotalPlaylists] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useRequireToken();

  useEffect(() => {
    document.title = buildTitle('Playlists');
  }, []);

  useEffect(() => {
    if (!token) return;
    
    const abort = new AbortController();

    fetchUserPlaylists(token, limit, { signal: abort.signal })
      .then(res => {
        if (abort.signal.aborted) return;
        if (res?.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error);
            setLoading(false);
          }
          return;
        }

        const items = res?.data?.items;
        const total = res?.data?.total;

        const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
        setPlaylists(safeItems);
        setTotalPlaylists(Number.isFinite(total) ? total : safeItems.length);
        setLoading(false);
      })
      .catch(err => {
        if (abort.signal.aborted) return;
        setError(err?.message || String(err));
        setLoading(false);
      });

    return () => abort.abort();
  }, [token, navigate]);

  return (
    <section className="playlists-container page-container" aria-labelledby="playlists-title">
      <h1 id="playlists-title" className="playlists-title page-title">Your Playlists</h1>
      <h2 className="playlists-count">
        {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} of {totalPlaylists}
      </h2>
      {loading && <output className="playlists-loading" data-testid="loading-indicator">Loading playlists…</output>}
      {error && !loading && <div className="playlists-error" role="alert">{error}</div>}
      {!loading && !error && (
        <ol className="playlists-list">
          {playlists.map(playlist => (
            <PlayListItem key={playlist.id} playlist={playlist} />
          ))}
        </ol>
      )}
    </section>
  );
}