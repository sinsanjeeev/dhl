var Validator = require("jsonschema").Validator;

var v = new Validator();
const Site = require("../models/site");
const { Op } = require("sequelize");
var _ = require("lodash");
const seqconn = require("../../util/dbutil");
const { QueryTypes } = require("sequelize");
let cacheService = require("../../util/cache-provider");
const Users = require("../models/users");
const Role = require("../models/role");
const UserRole = require("../models/userrole");
const UserSite = require("../models/usersite");
const AppModule = require("../models/appmodule");
const RoleModule = require("../models/rolemodule");
var log = require("../../util/logger");
const logger = log.getLogger("usermgmt");
module.exports.getAllUsers = async (req, res, next) => {
  try {
    // usercache = cacheService.instance().get("users");
    // if (_.isNil(usercache)) {
    userlist = await Users.findAll({
      logging: logger.info("Query For getAllUsers"),
      include: [
        {
          model: Role,
          include: [
            { model: AppModule, attributes: ["module_id", "module_name"] },
          ],
        },
        {
          model: Site,
          attributes: ["site_id", "site_name", "city", "site_code"],
        },
      ],
    });

    console.log(userlist);
    usercache = JSON.parse(JSON.stringify(userlist));
    //cacheService.instance().set("users", usercache);
    // }
    res.send(usercache);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getSelectedUsers = async (req, res, next) => {
  try {
    // usercache = cacheService.instance().get("users");
    // if (_.isNil(usercache)) {
    emailid = req.params.id;
    userlist = await Users.findAll({
      logging: logger.info("Query For getAllUsers"),
      include: [
        {
          model: Role,
          include: [
            { model: AppModule, attributes: ["module_id", "module_name"] },
          ],
        },
        {
          model: Site,
          attributes: ["site_id", "site_name", "city", "site_code"],
        },
      ],
      where: {
        email: {
          [Op.eq]: emailid,
        },
      },
    });

    console.log(userlist);
    usercache = JSON.parse(JSON.stringify(userlist));
    //cacheService.instance().set("users", usercache);
    // }
    res.send(usercache);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.userUpdateOrCreateOrDelete = async (req, res, next) => {
  try {
    logger.info("Query For userUpdateOrCreateOrDelete");
    action = req.body.action;

    let item = null;
    let responsebody = null;

    if (action === "create") {
      item = await Users.create(req.body, {
        include: [UserRole, UserSite],
      });
      responsebody = { created: true };
    } else if (action === "update") {
      whereclause = { user_id: req.body.user_id };
      whereclauserole = { id: req.body.dhl_user_role.role_id };
      //const t = await seqconn.transaction();
      responsebody = await seqconn.transaction(async (t) => {
        item = await Users.update(
          req.body,
          { where: whereclause },
          { transaction: t }
        );

        item = await UserRole.destroy(
          { where: whereclause },
          { transaction: t }
        );

        roleArr = req.body.dhl_user_role;

        roleArr.forEach(async (element) => {
          try {
            element.user_id = req.body.user_id;
            item = await UserRole.create(element, { transaction: t });
          } catch (err) {
            logger.error(err);
          }
        });

        item = await UserSite.destroy(
          { where: whereclause },
          { transaction: t }
        );

        siteArr = req.body.dhl_user_site;

        for (i = 0; i < siteArr.length; i++) {
          siteArr[i].user_id = req.body.user_id;
          item = await UserSite.create(siteArr[i], { transaction: t });
        }

        result = { updated: true };

        return result;
      });
    } else {
      whereclause = { user_id: req.body.user_id };
      responsebody = await seqconn.transaction(async (t) => {
        item = await Users.destroy({ where: whereclause }, { transaction: t });
        item = await UserRole.destroy(
          { where: whereclause },
          { transaction: t }
        );
        item = await UserSite.destroy(
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
    await t.rollback();

    res.send(err);
  }
};

loadAllUsers = async () => {
  try {
    userlist = await Users.findAll({
      include: [
        {
          model: Role,
          attributes: ["id", "role"],
        },
        {
          model: Site,
          attributes: ["site_name", "city", "site_code"],
        },
      ],
    });

    usercache = JSON.parse(JSON.stringify(userlist));
    cacheService.instance().set("users", usercache);
  } catch (err) {
    logger.error(err);
    console.log(err);
  }
};
