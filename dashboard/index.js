const express = require("express");
const compression = require('compression')
// const pool = require("./util/dbutil");
const sequelize=require("./util/dbutil");
const path = require("path");
const bodyParser = require("body-parser");
var cfenv = require("cfenv");
const warehouseLayoutRouter = require("./api/routes/WarehouseLayoutRouter");
const epcRouter = require("./api/routes/epcRouter");
const forkliftRouter = require("./api/routes/forkliftRouter");
const sysPropRouter = require("./api/routes/sysPropRouter");
const userRouter=require("./api/routes/userRouter");
const deviceRouter=require("./api/routes/deviceRouter");
const roleRouter=require("./api/routes/roleRouter");
const app = express();
let cacheProvider = require('./util/cache-provider');
let redisclient= require('./util/redis-service')
const fileUpload = require('express-fileupload');
var log = require('./util/logger')
const logger=log.getLogger('app')

app.use(compression());
app.use(fileUpload());
cacheProvider.start(function(err) {
	if (err) console.error(err);
});
sequelize.authenticate().then(() => {
  console.log("Datbase connected!");
}).catch((err) => {
  console.log(err);
});
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/layout", warehouseLayoutRouter);
app.use("/epc", epcRouter);
app.use("/forklift", forkliftRouter);
app.use("/sysprops", sysPropRouter);
app.use("/user", userRouter);
app.use("/device", deviceRouter);
app.use("/role", roleRouter);
app.use(express.static(path.join(__dirname, "build")));
// app.get('/dhl', function(req, res, next) {

// 		res.cookie('refreshToken', '211234', {maxAge: 1000 });
// 		res.sendFile(path.join(__dirname+'/build/index.html'))
	
//   })
app.use((error, req, res, next) => {
  if (typeof error.status === "undefined") {
    error.status = 500;
  }
  res.status(error.status);
  res.json({
    error: {
      message: error.message
    }
  });
});
// sequelize
// .sync()
// .then(result=>{
//   console.log(result)
// })
// .catch(err=>{
//   console.log(error)
// })
var appEnv = cfenv.getAppEnv();
const server = app.listen(appEnv.port, "0.0.0.0", function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  logger.info("Server Started at 6003")
});
