const log4js = require('log4js');
const _ = require("lodash");
let loglevel=process.env.LOG_LEVEL

if(_.isNil(loglevel)){
  loglevel='INFO'
}
// Logger configuration
log4js.configure({
    "appenders": {
      "access": {
        "type": "dateFile",
        "filename": "log/access.log",
        "pattern": "-yyyy-MM-dd",
        "category": "http"
      },
      "app": {
        "type": "file",
        "filename": "log/dhllog.log",
        "maxLogSize": 10485760,
        "numBackups": 10 ,
        layout: {
            type: 'pattern',
            pattern: '%d{[yyyy-MM-dd-hh.mm.ss]} - %f{1}(%l) %-5p : %m'
        },
        enableCallStack: true
      },
      "errorFile": {
        "type": "file",
        "filename": "log/errors.log",
        
        layout: {
            type: 'pattern',
            pattern: '%d{[yyyy-MM-dd-hh.mm.ss]} - %f{1}(%l) %-5p : %m'
        },
        "maxLogSize": 10485760,
        "numBackups": 10 
      },
      "errors": {
        "type": "logLevelFilter",
        "level": "ERROR",
        "appender": "errorFile"
      }
    },
    "categories": {
      "default": { "appenders": [ "app", "errors" ], "level": loglevel, "enableCallStack": true
    },
      "http": { "appenders": [ "access"], "level": loglevel }
    }
  });

// Create the logger
const logger = log4js;

module.exports=logger