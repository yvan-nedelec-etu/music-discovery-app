import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import { buildTitle } from '../../constants/appMeta.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import './PlaylistPage.css';
import '../PageLayout.css';

export default function PlaylistPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useRequireToken();
    
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <div className="playlist-error" role="alert">
                    {error}
                </div>
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

    const tracks = playlist.tracks?.items?.filter(item => item?.track) || [];
    const coverImage = playlist.images?.[0]?.url;

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
                        <p className="playlist-description">{playlist.description}</p>
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

            {tracks.length > 0 ? (
                <>
                    <h2 className="playlist-tracks-title">Tracks</h2>
                    <ol className="playlist-tracks-list">
                        {tracks.map(item => (
                            <TrackItem key={item.track.id} track={item.track} />
                        ))}
                    </ol>
                </>
            ) : (
                <div className="playlist-empty">This playlist is empty</div>
            )}
        </section>
    );
}