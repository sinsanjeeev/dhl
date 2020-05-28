const Site = require("../models/site");
const SysProp = require("../models/systemprops");
const { Op } = require("sequelize");
const _ = require("lodash");
let cacheUtilSvc = require("../../util/cache-service");
var log = require("../../util/logger");
const logger = log.getLogger("sysprop");
module.exports.getAllSysProps = async (req, res, next) => {
  try {
    propsList = await SysProp.findAll({
      include: [
        {
          model: Site,
          attributes: ["site_name", "city", "site_code"],
        },
      ],
    });
    propsList = JSON.parse(JSON.stringify(propsList));
    logger.debug(propsList);
    res.send(propsList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};
module.exports.getSysPropsForSite = async (req, res, next) => {
  try {
    logger.info("Query For getSysPropsForSite");

    propsList = await SysProp.findAll({
      include: [
        {
          model: Site,
          attributes: ["site_name", "city", "site_code"],
        },
      ],
      where: {
        site_id: {
          [Op.eq]: req.params.id,
        },
      },
    });

    propsList = JSON.parse(JSON.stringify(propsList));
    cacheUtilSvc.setCache("sysprops_" + req.params.id, propsList);
    res.send(propsList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};
module.exports.propUpdateOrCreateOrDelete = async (req, res, next) => {
  try {
    logger.info("Query For propUpdateOrCreateOrDelete");
    action = req.body.action;
    whereclause = { name: req.body.name, site_id: req.body.site_id };

    //const foundItem = await SysProp.findOne({ where: whereclause });
    let item = null;
    let responsebody = null;
    if (action === "create") {
      item = await SysProp.create(req.body,{logging: logger.info("Query for sysprop create")});
      responsebody = { created: true };
    } else if (action === "update") {
      item = await SysProp.update(req.body, { where: whereclause },{logging: logger.info("Query for sysprop update")});
      responsebody = { updated: true };
    } else {
      item = await SysProp.destroy({ where: whereclause },{logging: logger.info("Query for sysprop delete")});
      responsebody = { deleted: true };
    }
    await loadSysPropAfterModification(req.body.name, req.body.site_id);
    res.send(responsebody);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

loadSysPropAfterModification = async (name, siteid) => {
  try {
    let siteList = await Site.findAll({
      where: {
        site_id: {
          [Op.eq]: siteid,
        },
      },
    });
    siteList = JSON.parse(JSON.stringify(siteList));
    let sitecode = siteList[0].site_code;
    propsList = await SysProp.findAll({
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
    propsList = JSON.parse(JSON.stringify(propsList));

    //Any update in sysprops for a site will update cache for python trakntrace
    cacheUtilSvc.setCache("sys_props_" + sitecode, propsList);
    //Following cache update for dashboard only
    cacheUtilSvc.setCache("sysprops_" + siteid, propsList);
    console.log(propsList);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};
module.exports.sysPropMiddleWare = async (req, res, next) => {
  let cacheValue = await cacheUtilSvc.getFromCache("sysprops_" + req.params.id);
  if (!_.isNil(cacheValue)) {
    logger.info("sys prop cache found and returig from cache");
    res.send(cacheValue);
  } else {
    logger.info("sys prop cache  not found");
    next();
  }
};
