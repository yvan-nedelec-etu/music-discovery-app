const { setGlobalDispatcher, ProxyAgent, Agent } = require('undici');

function initNetwork() {
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.npm_config_proxy ||
    process.env.npm_config_https_proxy;

  if (proxy) {
    try {
      const agent = new ProxyAgent(proxy);
      setGlobalDispatcher(agent);
      if (process.env.DEBUG_PROXY === '1') {
        console.log('[sandbox] Using proxy:', proxy);
      }
    } catch (e) {
      console.warn('[sandbox] Failed to set proxy agent:', e.message);
    }
  } else {
    // Dispatcher par défaut (pas de proxy)
    setGlobalDispatcher(new Agent({ connections: 10, pipelining: 1 }));
  }
}

module.exports = { initNetwork };