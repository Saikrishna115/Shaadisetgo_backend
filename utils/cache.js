const NodeCache = require('node-cache');

// Initialize cache with standard TTL of 1 hour and check period of 2 hours
const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 7200,
  useClones: false // Disable cloning for better performance
});

// Wrapper for get operations with automatic caching
const getCached = async (key, fetchData, ttl = 3600) => {
  const cachedData = cache.get(key);
  if (cachedData) return cachedData;

  const freshData = await fetchData();
  cache.set(key, freshData, ttl);
  return freshData;
};

// Batch get operations
const mget = (keys) => {
  return cache.mget(keys);
};

// Set multiple keys
const mset = (keyValuePairs, ttl = 3600) => {
  return cache.mset(keyValuePairs.map(([key, value]) => ({
    key,
    val: value,
    ttl
  })));
};

// Delete cache entries
const del = (keys) => {
  return cache.del(keys);
};

// Flush entire cache
const flush = () => {
  return cache.flushAll();
};

// Get cache statistics
const getStats = () => {
  return cache.getStats();
};

module.exports = {
  cache,
  getCached,
  mget,
  mset,
  del,
  flush,
  getStats
};