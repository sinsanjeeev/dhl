const Sequelize = require('sequelize');
var _ = require("lodash");
let { user, host, database, password, port } = require("../config/db_config");
let log = require("./logger");
const logger = log.getLogger("db-util");
let use_db_from_config_file=process.env.USE_DB_FROM_CONFIG_FILE
if(!_.isNil(use_db_from_config_file) && use_db_from_config_file!='F'){
  user=process.env.SECRET_DBUSERNAME
  host=process.env.SECRET_DBHOST
  database=process.env.SECRET_DB
  password=process.env.SECRET_DBPASS
  port=process.env.SECRET_DBPORT
  console.log(user, host, database, password, port)
  
}
module.exports =  new Sequelize(database, user, password, {
  host: host,
  port:port,
  dialect: 'postgres',
  operatorsAliases: 0,
    dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    keepAlive: true,        
  },
  pool: {
    max: 2,
    min: 1
  },
  logging: (msg)=> {
    logger.info(msg)
  }
});

// const Pool = require("pg").Pool;
// const { user, host, database, password, port } = require("../config/db_config");
// const pool = new Pool({
//   user,
//   host,
//   database,
//   password,
//   port,
//   max: 2,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });
// module.exports = pool;
