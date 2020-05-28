let cacheProvider = require("./cache-provider");
const redis_client = require("../util/redis-service");
const _ = require("lodash");

const util = require("util");
var log = require("./logger");
const logger = log.getLogger("cache-service");
exports.getFromCache = async (cackekey) => {
  if (!_.isNil(redis_client)) {
    redis_client.get = util.promisify(redis_client.get);
    let cacheValue = await redis_client.get(cackekey);
    if (!_.isNil(cacheValue)) {
      return JSON.parse(cacheValue);
    } else {
      return null;
    }
  } else {
    cacheValue = cacheProvider.instance().get(cackekey);
    if (!_.isNil(cacheValue)) {
      return cacheValue;
    } else {
      return null;
    }
  }
};

exports.setCache = async (cackekey, cahceobj) => {
  try {
    if (!_.isNil(redis_client)) {
      redis_client.set(cackekey, JSON.stringify(cahceobj));
    } else {
      cacheProvider.instance().set(cackekey, cahceobj);
    }
  } catch (err) {
    logger.error(err)
  }
};

exports.setRedisCacheOnly = async (cackekey, cahceobj) => {
  try {
    if (!_.isNil(redis_client)) {
      redis_client.set(cackekey, JSON.stringify(cahceobj));
    }
  } catch (err) {
    logger.error(err)
  }
};
