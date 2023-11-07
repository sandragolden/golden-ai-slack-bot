const NodeCache = require('node-cache');

const isKeyEmpty = (key) => typeof key === 'undefined' || key === null;

class Cache {
    constructor(options) {
        this.cache = new NodeCache(options);
    }

    get(key) {
        if (isKeyEmpty(key)) {
            return null;
        }

        return this.cache.get(key);
    }

    set(key, value, ttl) {
        if (isKeyEmpty(key)) {
            return;
        }
        this.cache.set(key, value, ttl);
    }
}

module.exports = Cache;
