var Validator = require("jsonschema").Validator;
var _ = require("lodash");
const seqconn = require("../../util/dbutil");

const Role = require("../models/role");

const AppModule = require("../models/appmodule");
const RoleModule = require("../models/rolemodule");
var log = require("../../util/logger");
const logger = log.getLogger("rolemgmt");
const { Op } = require("sequelize");

module.exports.roleUpdateOrCreateOrDelete = async (req, res, next) => {
  try {
    logger.info("Query For roleUpdateOrCreateOrDelete");
    action = req.body.action;

    let item = null;
    let responsebody = null;

    if (action === "create") {
      item = await Role.create(req.body, {
        include: [RoleModule],
      });

      responsebody = { created: true };
    } else if (action === "update") {
      whereclause = { role_id: req.body.role_id };
      responsebody = await seqconn.transaction(async (t) => {
        item = await Role.update(
          req.body,
          { where: whereclause },
          { transaction: t }
        );

        item = await RoleModule.destroy(
          { where: whereclause },
          { transaction: t }
        );
        roleArr = req.body.dhl_role_module;

        for (i = 0; i < roleArr.length; i++) {
          roleArr[i].role_id = req.body.role_id;
          item = await RoleModule.create(roleArr[i], { transaction: t });
        }
        result = { updated: true };
        return result;
      });
    } else {
      whereclause = { role_id: req.body.role_id };
      responsebody = await seqconn.transaction(async (t) => {
        item = await Role.destroy({ where: whereclause }, { transaction: t });
        item = await RoleModule.destroy(
          { where: whereclause },
          { transaction: t }
        );
        result = { deleted: true };
        return result;
      });
    }

    //await loadAllUsers();

    res.send(responsebody);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getAllModule = async (req, res, next) => {
  try {
    // usercache = cacheService.instance().get("users");
    // if (_.isNil(usercache)) {
    modulelist = await AppModule.findAll({
      logging: logger.info("Query For getAllModule"),
    });

    modulelist = JSON.parse(JSON.stringify(modulelist));
    //cacheService.instance().set("users", usercache);
    // }
    res.send(modulelist);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getAllRoles = async (req, res, next) => {
  try {
    // usercache = cacheService.instance().get("users");
    // if (_.isNil(usercache)) {
    rolelist = await Role.findAll({
      logging: logger.info("Query For getAllRoles"),
      include: [{ model: AppModule, attributes: ["module_id", "module_name"] }],
    });

    console.log(rolelist);
    rolecache = JSON.parse(JSON.stringify(rolelist));
    //cacheService.instance().set("users", usercache);
    // }
    res.send(rolecache);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};
