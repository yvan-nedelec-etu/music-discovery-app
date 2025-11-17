import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';

export default function PlaylistPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useRequireToken();
    
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                console.log('Playlist data:', res.data);
                console.log('First track:', res.data?.tracks?.items?.[0]?.track);
                setPlaylist(res.data);
                setLoading(false);
            })
            .catch(err => {
                if (abort.signal.aborted) return;
                setError(err?.message || String(err));
                setLoading(false);
            });

        return () => abort.abort();
    }, [token, id, navigate]);

    if (loading) return <div>Loading playlist...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!playlist) return <div>Playlist not found</div>;

    return (
        <div>
            <h1>Playlist: {playlist.name}</h1>
            <pre>{JSON.stringify(playlist, null, 2)}</pre>
        </div>
    );
}