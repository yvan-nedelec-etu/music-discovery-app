import { useState, useEffect } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import './TopTracksPage.css';
import '../PageLayout.css';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import { fetchUserTopTracks } from '../../api/spotify-me.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import { useNavigate } from 'react-router-dom';

/**
 * Number of top tracks to fetch
 */
export const limit = 10;

/** Time range for top tracks */
export const timeRange = 'short_term';

/**
 * TopTracks Page 
 * @returns {JSX.Element}
 */
export default function TopTracksPage() {
  const navigate = useNavigate();

  const [tracks, setTracks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useRequireToken();

  useEffect(() => { 
    document.title = buildTitle('Top Tracks'); 
  }, []);

  useEffect(() => {
    if (!token) return;
    
    const abort = new AbortController();

    fetchUserTopTracks(token, limit, timeRange, { signal: abort.signal })
      .then(res => {
        if (abort.signal.aborted) return;
        if (res?.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error);
          }
          setLoading(false);
          return;
        }
        setTracks(res?.data?.items ?? []);
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
    <section className="tracks-container page-container" aria-labelledby="tracks-title">
      <h1 id="tracks-title" className="tracks-title page-title">Your Top {tracks.length} Tracks of the Month</h1>
      {loading && <output className="tracks-loading" data-testid="loading-indicator">Loading top tracks…</output>}
      {error && !loading && <div className="tracks-error" role="alert">{error}</div>}
      {!loading && !error && (
        <ol className="tracks-list">
          {tracks.map(track => (
            <TrackItem key={track.id} track={track} />
          ))}
        </ol>
      )}
    </section>
  );
}