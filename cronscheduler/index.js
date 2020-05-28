var cron = require("node-cron");
let redisclient = require("./util/redis-service");
const Site = require("./models/site");
const Location = require("./models/location");
const Epc = require("./models/epc");
const { Op } = require("sequelize");

var log = require("./util/logger");
const logger = log.getLogger("app");

var LZUTF8 = require("lzutf8");
const _ = require("lodash");
let sitelistarr = null;
let unit=process.env.TIME_UNIT
let qty=process.env.TIME_QTY
let cronschedule=null
if(unit==='MIN'){
  cronschedule=`*/${qty} * * * *`
}else{
  cronschedule=`*/${qty} * * * * *`
}
let getSite = async () => {
  try {
    console.log("******************");

    sitelist = await Site.findAll({
      attributes: ["site_id"],
    });

    //console.log(sitelist);
    sitelist = JSON.parse(JSON.stringify(sitelist));

    return sitelist;
  } catch (err) {
    logger.error(err);
  }
};

cron.schedule(cronschedule, async () => {
  console.log(`running a task every ${qty} ${unit}`);
  if (!_.isNil(sitelistarr)) {
    getAllEpc();
  } else {
    sitelistarr = await getSite();
  }

  //
  //  redisclient.get = util.promisify(redisclient.get);
  //  epclist=await redisclient.get('epclist')
  //  var output = LZUTF8.decompress(epclist,{inputEncoding: "StorageBinaryString", outputEncoding: "String"});
  //  console.log(JSON.parse(output))
});

let getAllEpc = async () => {
  try {
    if (!_.isNil(sitelistarr)) {
      sitelistarr.forEach(async (element) => {
        epcList = await Epc.findAll({
          logging: logger.info("Query For getAllEpc"),
          include: [
            {
              model: Site,
              attributes: ["site_name", "city"],
            },
            {
              model: Location,
              attributes: ["location_name"],
            },
          ],
          where: {
            is_shipped: {
              [Op.eq]: "F",
            },
            site_id: {
              [Op.eq]: element.site_id,
            },
          },
        });
        //console.table(epcList);
        epcstr = JSON.stringify(epcList);
        console.log("&&&&&&&&&&&"+epcstr.length);
        var output = LZUTF8.compress(JSON.stringify(epcList), {
          outputEncoding: "StorageBinaryString",
        });
        console.log(output.length);
        //console.log(output)
        redisclient.set("epclist_" + element.site_id, output);
      });
    }
  } catch (err) {
    logger.error(err);
  }
};
