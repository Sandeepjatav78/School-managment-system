const SchoolSetting = require('../models/SchoolSetting');

let cache = { value: null, at: 0 };
const TTL = 30 * 1000;

function invalidate() {
  cache.value = null;
}

module.exports = (feature) => async (req, res, next) => {
  try {
    if (!cache.value || Date.now() - cache.at > TTL) {
      const settings = await SchoolSetting.get();
      cache.value = settings.features ? settings.features.toObject() : {};
      cache.at = Date.now();
    }
    if (cache.value[feature] === false) {
      return res.status(403).json({ message: 'This facility is not offered by the school' });
    }
    next();
  } catch {
    next();
  }
};

module.exports.invalidate = invalidate;