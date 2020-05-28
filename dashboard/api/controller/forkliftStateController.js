const Site = require("../models/site");
const Location = require("../models/location");
const Forklift = require("../models/forklift");
const ForkliftLogEvent = require("../models/forklifteventlog");
const { Op } = require("sequelize");
var log = require("../../util/logger");
const logger = log.getLogger("sysprop");
module.exports.getAllForklift = async (req, res, next) => {
  try {
    
    forkliftList = await Forklift.findAll({
      logging:logger.info("Query For getAllForklift"),
      include: [
        {
          model: Site,
          attributes: ["site_name", "city"]
        },
        {
          model: Location,
          attributes: ["location_name"]
        }
      ],
      where: {
        site_id: {
          [Op.eq]: req.params.id
        }
      }
    });
    
    res.send(forkliftList);
  } catch (err) {
    logger.error(err)
    res.send(err);
    
  }
};

module.exports.getForkliftMovement = async (req, res, next) => {
  try {
   
    forkliftList = await ForkliftLogEvent.findAll({
      logging:logger.info("Query For getForkliftMovement"),
      include: [
        {
          model: Site,
          attributes: ["site_name", "city"]
        },
        {
          model: Location,
          attributes: ["location_name"]
        }
      ],
      where: {
        site_id: {
          [Op.eq]: req.query.siteid
        },
        device_id: {
          [Op.eq]: req.query.deviceid
        },
        device_timestamp: {
          // [Op.gt]: 18
          [Op.between]: [req.query.starttime, req.query.endtime]
        }
      }
    });
    
    res.send(forkliftList);
  } catch (err) {
    logger.error(err)
    res.send(err);
   
  }
};
