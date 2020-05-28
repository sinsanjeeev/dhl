const express = require("express");
const path = require("path");
var cors = require('cors');


var app = express();
var http = require('http').createServer(app);
var sdk = require("@wiotp/sdk")
app.use(cors({ origin: '*' }));
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.header('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', false);

  // Pass to next layer of middleware
  next();
});
var io = require('socket.io')(http, {
  log: false,
  agent: false,
  origins: '*:*',
  transports: ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'polling'],
  path: '/forkliftio/socket.io'
});

io = io.of('/forkliftsocket');
var cfenv = require("cfenv");
var appEnv = cfenv.getAppEnv();

let api_key=process.env.API_KEY
let api_token=process.env.API_TOKEN
let gateway=process.env.GATEWAY_TYPE
let app_id=process.env.APP_ID

//io.origins(['https://refinerycluster.us-south.containers.appdomain.cloud/socket.io','https://refinerycluster.us-south.containers.appdomain.cloud/forkliftsocket']);


require('dotenv').config()

//const server = io.listen(appEnv.port);
let sequenceNumberByClient = new Map();
//let appConfig = sdk.ApplicationConfig.parseEnvVars();
io.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);
  
  // initialize this client's sequence number
  sequenceNumberByClient.set(socket, 1);

  // when socket disconnects, remove it from the list:
  socket.on("disconnect", () => {
      sequenceNumberByClient.delete(socket);
      console.info(`Client gone [id=${socket.id}]`);
  });
});
let identity = {appId: app_id}
let auth = {
    key: api_key, 
    token: api_token
  };
  console.log(auth)
  let options = {
    logLevel:"info", 
    mqtt: {
      transport:"websockets", 
      port: parseInt("8883")
    }
  };
let appConfig = new sdk.ApplicationConfig(identity, auth, options);

let appClient = new sdk.ApplicationClient(appConfig);
appClient.connect();
// Do stuff

appClient.on("connect", function () {
    console.log("CONNECTED");
    //console.info('server port is '+appEnv.port);

    gatewayarr=gateway.split(',')
    console.log("***************"+gatewayarr)
    gatewayarr.forEach(element=>{
      console.log("&&&&&&&&&&&&&&"+element)
      appClient.subscribeToEvents(element);
    })
    //appClient.subscribeToEvents(gateway);
  });
  appClient.on("reconnect", function () {
    console.log("RECONNECTING");
  });
  appClient.on("close", function () {
    console.log("DISCONNECTED");
  });
  appClient.on("offline", function () {
    console.log("OFFLINE");
  });

  // Error callback
  appClient.on("error", function (err) {
    console.log(err);
  });
appClient.on("deviceEvent", function (typeId, deviceId, eventId, format, payload) {
    console.log("Device Event from :: " + typeId + " : " + deviceId + " of event " + eventId + " with format " + format + " - payload = " + payload);
    let jsonObj=JSON.parse(payload.toString('utf8'))
    epc=jsonObj.EPC
    asciistr=""
    if(epc!=""){
      asciistr=hex_to_ascii(epc)
      jsonObj.REF_ID=asciistr
    }else{
      jsonObj.REF_ID=asciistr
    }
    
    for (const [client, sequenceNumber] of sequenceNumberByClient.entries()) {
      client.emit("my_response", JSON.stringify(jsonObj));
      sequenceNumberByClient.set(client, sequenceNumber + 1);
  }
  });

  let  hex_to_ascii=(str1)=>{
   var hex  = str1.toString();
   var str = '';
   for (var n = 0; n < hex.length; n += 2) {
     str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
   }
   return str;
  }

  http.listen(6004,'0.0.0.0', function(){
    console.log('listening on port:'+6004);
  });