import { fetchUserTopArtists, fetchUserTopTracks } from './spotify-top.js';

describe('spotify-top api helpers', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  function mockFetchOnce({ ok, statusText = 'Bad Request', json }) {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      statusText,
      json: () => Promise.resolve(json)
    });
  }

  test('fetchUserTopArtists success returns data and builds default limit=10', async () => {
    const payload = { items: [{ id: 'a1' }] };
    mockFetchOnce({ ok: true, json: payload });

    const res = await fetchUserTopArtists('token123');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toMatch(/top\/artists\?limit=10$/);
    const options = global.fetch.mock.calls[0][1];
    expect(options.headers.Authorization).toBe('Bearer token123');

    expect(res).toEqual({ data: payload, error: null });
  });

  test('fetchUserTopTracks success with custom limit', async () => {
    const payload = { items: [{ id: 't1' }] };
    mockFetchOnce({ ok: true, json: payload });

    const res = await fetchUserTopTracks('tokenABC', { limit: 5 });

    const url = global.fetch.mock.calls[0][0];
    expect(url).toMatch(/top\/tracks\?limit=5$/);
    expect(res).toEqual({ data: payload, error: null });
  });

  test('fetchUserTopArtists error branch uses json.error.message when present', async () => {
    mockFetchOnce({
      ok: false,
      json: { error: { message: 'Rate limit exceeded' } }
    });

    const res = await fetchUserTopArtists('tok');

    expect(res.data).toBeNull();
    expect(res.error).toBe('Rate limit exceeded');
  });

  test('fetchUserTopTracks error branch falls back to statusText when message missing', async () => {
    mockFetchOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: { error: { status: 401 } }
    });

    const res = await fetchUserTopTracks('tok');

    expect(res.data).toBeNull();
    expect(res.error).toBe('Unauthorized');
  });

  test('fetchUserTopArtists handles fetch rejection (propagates exception)', async () => {
    const err = new Error('Network down');
    global.fetch = jest.fn().mockRejectedValue(err);

    await expect(fetchUserTopArtists('token123')).rejects.toThrow('Network down');
  });

  test('fetchUserTopTracks passes AbortSignal through options', async () => {
    const payload = { items: [] };
    const controller = new AbortController();
    mockFetchOnce({ ok: true, json: payload });

    await fetchUserTopTracks('t', { signal: controller.signal });

    const options = global.fetch.mock.calls[0][1];
    expect(options.signal).toBe(controller.signal);
  });
});