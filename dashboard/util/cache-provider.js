let nodeCache = require('node-cache');
let _ = require("lodash");
let cache = null;

exports.start = function(done) {
    if (cache) return done();

    cache = new nodeCache({ stdTTL: 0, checkperiod: 0 });
}

exports.instance = function() {
   
        console.log("###########################",cache.getStats())
  
    
    return cache;
}
exports.stat = function() {
    return cache.getStats();
}