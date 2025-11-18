import { useEffect, useState } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-top.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard.jsx';

export default function DashboardPage() {
  const { token } = useRequireToken();
  const [artists, setArtists] = useState(null);
  const [tracks, setTracks] = useState(null);
  const [errorArtists, setErrorArtists] = useState(null);
  const [errorTracks, setErrorTracks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = buildTitle('Dashboard'); }, []);

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
        <>
          {errorArtists ? (
            <div className="dashboard-error" role="alert" data-testid="dashboard-artists-error">
              {errorArtists}
            </div>
          ) : (
            artists?.items?.[0] && (
              <SimpleCard
                data-testid="top-artist-card"
                title={artists.items[0].name}
                imageUrl={artists.items[0].images?.[0]?.url}
                subtitle={artists.items[0].genres?.slice(0, 3).join(', ') || 'Genres inconnus'}
                description="Artiste le plus écouté"
              />
            )
          )}
        </>
      )}
    </section>
  );
}