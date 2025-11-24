export async function fetchUserTopArtists(token, { limit = 10, signal } = {}) {
  const res = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal
  });
  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error?.message || res.statusText };
  return { data: json, error: null };
}

export async function fetchUserTopTracks(token, { limit = 10, signal } = {}) {
  const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal
  });
  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error?.message || res.statusText };
  return { data: json, error: null };
}