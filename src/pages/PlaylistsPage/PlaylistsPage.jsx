import { useState, useEffect, useMemo } from 'react';
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

export default function PlaylistsPage() {
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [totalPlaylists, setTotalPlaylists] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useRequireToken();

  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => {
    if (!query.trim()) return playlists;
    const q = query.trim().toLowerCase();
    return playlists.filter(p => (p.name || '').toLowerCase().includes(q));
  }, [playlists, query]);

  const showNoMatch = !loading && !error && playlists.length > 0 && filtered.length === 0;

  return (
    <section className="playlists-container page-container" aria-labelledby="playlists-title">
      <h1 id="playlists-title" className="playlists-title page-title">Your Playlists</h1>
      <h2 className="playlists-count">
        {filtered.length} playlist{filtered.length !== 1 ? 's' : ''} of {totalPlaylists}
      </h2>

      <div role="search" className="playlists-search-wrapper">
        <label htmlFor="playlist-search" className="visually-hidden">Search playlists</label>
        <input
          id="playlist-search"
          type="search"
          className="playlists-search-input"
          placeholder="Search playlists…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          data-testid="playlist-search"
          aria-describedby="playlists-search-hint"
        />
        <small id="playlists-search-hint" className="playlists-search-hint">
          Type to filter by name (live).
        </small>
      </div>

      {loading && <output className="playlists-loading" data-testid="loading-indicator">Loading playlists…</output>}
      {error && !loading && <div className="playlists-error" role="alert">{error}</div>}

      {!loading && !error && (
        <>
          {showNoMatch && (
            <p data-testid="no-results" className="playlists-no-results">
              No matching playlists for “{query}”.
            </p>
          )}
          {!showNoMatch && (
            <ol className="playlists-list" data-testid="playlists-list">
              {filtered.map(playlist => (
                <PlayListItem key={playlist.id} playlist={playlist} />
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}