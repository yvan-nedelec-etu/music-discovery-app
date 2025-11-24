import { useEffect, useState } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-top.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard.jsx';
import '../../styles/DashboardPage.css';

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
      <p className="dashboard-subtitle" aria-describedby="dashboard-cards">
        Your top artist and track
      </p>

      {loading && <div data-testid="dashboard-loading">Loading...</div>}

      {!loading && (
        <div id="dashboard-cards" className="dashboard-cards">
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
                link={artists.items[0].external_urls?.spotify}
              />
            )
          )}

          {errorTracks ? (
            <div className="dashboard-error" role="alert" data-testid="dashboard-tracks-error">
              {errorTracks}
            </div>
          ) : (
            tracks?.items?.[0] && (
              <SimpleCard
                data-testid="top-track-card"
                title={tracks.items[0].name}
                imageUrl={tracks.items[0].album?.images?.[0]?.url}
                subtitle={tracks.items[0].artists?.map(a => a.name).join(', ') || 'Artistes inconnus'}
                description="Piste la plus écoutée"
                link={tracks.items[0].external_urls?.spotify}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}