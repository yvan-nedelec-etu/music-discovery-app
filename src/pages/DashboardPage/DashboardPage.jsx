import { useEffect, useState } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-top.js';

export default function DashboardPage() {
  const { token } = useRequireToken();
  const [artists, setArtists] = useState(null);
  const [tracks, setTracks] = useState(null);
  const [errorArtists, setErrorArtists] = useState(null);
  const [errorTracks, setErrorTracks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = buildTitle('Dashboard');
  }, []);

  useEffect(() => {
    if (!token) return;
    const abort = new AbortController();
    Promise.all([
      fetchUserTopArtists(token, { limit: 10, signal: abort.signal }),
      fetchUserTopTracks(token, { limit: 10, signal: abort.signal })
    ])
      .then(([aRes, tRes]) => {
        if (abort.signal.aborted) return;
        if (aRes.error) setErrorArtists(aRes.error); else setArtists(aRes.data);
        if (tRes.error) setErrorTracks(tRes.error); else setTracks(tRes.data);
        setLoading(false);
        if (aRes.data) console.log('[dashboard] topArtists[0]', aRes.data.items?.[0]);
        if (tRes.data) console.log('[dashboard] topTracks[0]', tRes.data.items?.[0]);
      })
      .catch(err => {
        if (abort.signal.aborted) return;
        const msg = err.message || String(err);
        setErrorArtists(msg);
        setErrorTracks(msg);
        setLoading(false);
      });
    return () => abort.abort();
  }, [token]);

  return (
    <section className="dashboard-page page-container" data-testid="dashboard-page">
      <h1 className="page-title">Dashboard</h1>
      {loading && <div data-testid="dashboard-loading">Loading...</div>}
      {!loading && (
        <pre className="dashboard-debug" style={{ fontSize: '0.75rem' }}>
          Artists loaded: {Boolean(artists)} | Tracks loaded: {Boolean(tracks)}
        </pre>
      )}
      {errorArtists && <div role="alert" style={{ display: 'none' }}>{errorArtists}</div>}
      {errorTracks && <div role="alert" style={{ display: 'none' }}>{errorTracks}</div>}
    </section>
  );
}