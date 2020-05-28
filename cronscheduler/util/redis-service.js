const redis = require('redis')
var _ = require("lodash");
let host=process.env.SECRET_REDIS_HOST
let  pwd=process.env.SECRET_REDIS_PASS
let port=process.env.SECRET_REDIS_PORT

let user_redis=process.env.USE_REDIS
var log = require("./logger");
const logger = log.getLogger("redisservice");
let rclient = null;
if(!_.isNil(user_redis) && user_redis!='F'){
    logger.info(`redis conncted to host ${host} and port ${port}`)
    rclient = redis.createClient(port,host);
    rclient.auth(pwd)

    rclient.on('connect', function (err, response) {
        'use strict';
        console.log("Connected to redis database");
        logger.info("Connected to redis database")
        // rclient.get('site_id_ORD',(err, reply)=>{
        //     console.log(reply);
        // })
    });

}


module.exports = rclient;