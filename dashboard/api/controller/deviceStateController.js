var Validator = require("jsonschema").Validator;
var v = new Validator();
const Site = require("../models/site");
const { Op } = require("sequelize");
var _ = require("lodash");

const DeviceState = require("../models/devicestatus");
var log = require("../../util/logger");
const logger = log.getLogger("devicestatus");
module.exports.getDeviceForSite = async (req, res, next) => {
  try {
   
    siteid = req.params.id;

    devicelist = await DeviceState.findAll({
      logging:logger.info("Query for getDeviceForSite"),
      include: [
        {
          model: Site,
          attributes: ["site_name", "city", "site_code"],
        },
      ],
      where: {
        site_id: {
          [Op.eq]: siteid,
        },
      },
    });
    
    devicelist = JSON.parse(JSON.stringify(devicelist));
    devicehasmap = _.keyBy(devicelist, "device_id");

    res.send(devicehasmap);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};
