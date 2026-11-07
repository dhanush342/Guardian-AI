// Bound upstream calls so an unavailable provider cannot hold requests indefinitely.
module.exports = function request(fetcher, url, options = {}) {
  return fetcher(url, { ...options, signal: options.signal || AbortSignal.timeout(12000) });
};
