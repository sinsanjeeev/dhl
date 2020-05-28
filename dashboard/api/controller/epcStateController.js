var Validator = require("jsonschema").Validator;
var v = new Validator();

const site_config = require("../../config/site_config");
const Site = require("../models/site");
const Location = require("../models/location");
const Epc = require("../models/epc");
const EpcLogEvent = require("../models/epceventlog");
const { Op } = require("sequelize");
var _ = require("lodash");
const seqconn = require("../../util/dbutil");
const { QueryTypes } = require("sequelize");
let cacheService = require("../../util/cache-provider");
var log = require("../../util/logger");
const logger = log.getLogger("devicestatus");
const redis_client = require("../../util/redis-service");
var LZUTF8 = require("lzutf8");
const util = require("util");
module.exports.getAllEpc = async (req, res, next) => {
  try {
   
    epcList = await Epc.findAll({
      logging:logger.info("Query For getAllEpc"),
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
          [Op.eq]: req.params.id,
        },
      },
    });
    //console.table(epcList);
    
    res.send(epcList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getEpcsBetweenDate = async (req, res, next) => {
  try {
    epcList = await EpcLogEvent.findAll({
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
          [Op.eq]: req.query.siteid,
        },
        rfid_timestamp: {
          // [Op.gt]: 18
          [Op.between]: [req.query.starttime, req.query.endtime],
        },
      },
    });
    //console.table(epcList);
    res.send(epcList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getEpc = async (req, res, next) => {
  try {
    console.log("******************");
    refid = "%" + req.params.id + "%";
    epcList = await Epc.findAll({
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
        reference_number: {
          [Op.like]: refid,
        },
      },
    });
    // console.table(epcList);
    res.send(epcList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getEpcMovement = async (req, res, next) => {
  try {
    console.log("******************");
    refid = "%" + req.params.id + "%";
    epcList = await EpcLogEvent.findAll({
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
        reference_number: {
          [Op.like]: refid,
        },
      },

      order: [["rfid_timestamp", "ASC"]],
    });
    //console.table(epcList);
    res.send(epcList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.updateEpcShippedStatus = async (req, res, next) => {
  try {
    console.log("******************");
    let validation = v.validate(req.body, site_config.siteSchema);
    sucsess = {};
    errorArray = {};
    sucsess.updatestatus = "updated";
    errorArray.updatestatus = "error";
    if (!validation.valid) {
      errorArray.error = validation.errors;
      res.send(errorArray);
    } else {
      if (!_.isNil(req.body)) {
        if (Array.isArray(req.body)) {
          epcArr = req.body;

          sitecache = await getSites();
          epcArr.forEach(async (element) => {
            ref = element.reference_number;
            refcluse = "reference_number like '%" + ref + "%'";
            updated_utc = element.updated_utc;
            code = element.site_code;
            shipped_status = element.shipped_status;
            if (element.piece_number) {
              ref = ref + "_" + element.piece_number;
              refcluse = "reference_number like '%" + ref + "'";
            }
            siteObj = _.find(sitecache, { site_code: code.toUpperCase() });
            if (_.isEmpty(ref)) {
              ref = "xxxxxxxxxxxxx";
            }
            updateqry =
              "update dhl_epc_state set is_shipped ='" +
              shipped_status +
              "', updated_utc='" +
              updated_utc +
              "' " +
              "where site_id=" +
              siteObj.site_id +
              " and " +
              refcluse;
            const updaterec = await seqconn.query(updateqry, {
              type: QueryTypes.UPDATE,
            });
            console.log(updaterec);
          });
        } else {
        }
      }

      res.send(sucsess);
    }
  } catch (err) {
    errorArray.updatestatus = err;
    logger.error(errorArray);
    res.send(errorArray);
  }
};

getSites = async () => {
  try {
    console.log("******************");
    sitecache = cacheService.instance().get("site");
    if (_.isNil(sitecache)) {
      sitecache = await Site.findAll({ raw: true });

      cacheService.instance().set("site", sitecache);
    }
    //site = _.find(sitecache, { site_code: sitecode.toUpperCase() });
    return sitecache;
  } catch (err) {
    logger.error(err);
  }
};
module.exports.epcMiddleWare = async (req, res, next) => {
 
  if (!_.isNil(redis_client)) {
    logger.info("sys prop cache found and returig from cache");
   redis_client.get = util.promisify(redis_client.get);
   try{
    var epclist=await redis_client.get('epclist_'+req.params.id)
    var output = LZUTF8.decompress(epclist,{inputEncoding: "StorageBinaryString", outputEncoding: "String"});
   }catch (err) {
    console.log(err);
  }
  
   //console.log(JSON.parse(output))
    res.send(JSON.parse(output));
  } else {
    logger.info("sys prop cache  not found");
    next();
  }
};