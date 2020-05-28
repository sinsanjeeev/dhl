var Validator = require("jsonschema").Validator;
var v = new Validator();
const Site = require("../models/site");
const Location = require("../models/location");
const SubLocation = require("../models/sublocation");
const SiteImages = require("../models/siteimages");
const location_config = require("../../config/location_config");
const { encode, decode } = require("base64-arraybuffer");
var _ = require("lodash");
//var arrayToTree = require('array-to-tree');
const seqconn = require("../../util/dbutil");
const { QueryTypes } = require("sequelize");
const { Op } = require("sequelize");

let cacheService = require("../../util/cache-provider");
let cacheUtilSvc = require("../../util/cache-service");
var log = require("../../util/logger");
const logger = log.getLogger("layoutcontroller");

module.exports.getSite = async (req, res, next) => {
  try {
    console.log("******************");

    sitelist = await Site.findAll({
      include: [
        {
          model: SiteImages,
          attributes: ["site_id", "image_name", "image"],
        },
      ],
    });

    //console.log(sitelist);
    sitecache = JSON.parse(JSON.stringify(sitelist));
    cacheUtilSvc.setCache("site", sitecache);

    res.send(sitecache);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getLocation = async (req, res, next) => {
  try {
    
    loactionlist = await Location.findAll({
      logging:logger.info("Query for getLocation"),
      include: [
        {
          model: Site,
          attributes: ["site_name", "city"],
        },
        {
          model: Location,
          as: "parent_name",
          attributes: ["location_name", "location_id"],
        },
      ],
      where: {
        locationxy_coordinate: {
          [Op.not]: null,
        },
        site_id: {
          [Op.eq]: req.params.id,
        },
      },
    });

    //console.table(loactionlist)
    res.send(loactionlist);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getLocationHierarchy = async (req, res, next) => {
  locationObject = {};
  try {
    siteid = req.params.id;
    sql =
      "(SELECT  parent.location_name as parent,  child.location_name as child,child.locationxy_coordinate  as child_location,parent.locationxy_coordinate as parent_loc " +
      "FROM dhl_site_location child,dhl_site_location parent where child.parent_location =parent.location_id and parent.location_name !='NA' and parent.site_id=" +
      siteid +
      " order by parent.parent_location) " +
      "UNION " +
      "(SELECT  '' as parent ,location_name as child ,locationxy_coordinate as child_location,'{\"xy\":[]}' as parent_loc from dhl_site_location where  location_name !='NA' and site_id=" +
      siteid +
      " and parent_location is null ) ";
    const loc = await seqconn.query(sql, { type: QueryTypes.SELECT });
    result = _.filter(loc, { parent: "" });
    var childloc = _.filter(loc, function (obj) {
      return obj.parent != "";
    });
    newobjarr = [];
    result.forEach((element) => {
      tmpobj = {};
      tmpobj.area = element.child;
      tmpobj.location = element.child_location;
      tmpobj.children = [];
      newobjarr.push(tmpobj);
    });
    childloc.forEach((element) => {
      tmpnewobj = _.filter(newobjarr, { area: element.parent });
      tmpnewobj[0].children.push(element);
    });

    locationObject.locationhierarchy = newobjarr;
    locationObject.locationwithouthierarchy = loc;
    res.send(locationObject);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getSubLocationHierarchy = async (req, res, next) => {
  sublocationObject = {};
  try {
    console.log("******************");
    loactionlist = await SubLocation.findAll({
      include: [
        {
          model: Location,
          attributes: ["location_name", "location_name"],
        },
      ],
      where: {
        site_id: {
          [Op.eq]: req.params.id,
        },
      },
    });
    //console.table(loactionlist)
    result = _.filter(
      _.uniq(
        _.map(loactionlist, function (item) {
          if (
            _.filter(loactionlist, {
              dhl_site_location: {
                location_name: item.dhl_site_location.location_name,
              },
            }).length > 0
          ) {
            return item.dhl_site_location.location_name;
          }

          return false;
        })
      ),
      function (value) {
        return value;
      }
    );
    objarr = {};
    result.forEach((element) => {
      tmpobj = [];
      objarr[element] = tmpobj;
    });

    loactionlist.forEach((element) => {
      tmpnewobj = _.filter(objarr, element.dhl_site_location.location_name);
      objarr[element.dhl_site_location.location_name].push(element);
    });
    sublocationObject.sublocationhierarchy = objarr;
    sublocationObject.sublocationwithouthierarchy = loactionlist;
    res.send(sublocationObject);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.getCompleteLocationHierarchy = async (req, res, next) => {
  try {
    
    let layout_key = "layout_" + req.params.id;

    let loactionlist = await Location.findAll({
      logging:logger.info("Query For getCompleteLocationHierarchy"),
      raw: true,
      include: [
        {
          model: Site,
          attributes: ["site_name", "city", "site_code"],
        },
      ],
      where: {
        locationxy_coordinate: {
          [Op.not]: null,
        },
        site_id: {
          [Op.eq]: req.params.id,
        },
      },
    });

    let layoutcache = arrayToTree(
      loactionlist,
      "location_id",
      "parent_location"
    );
    //cacheService.instance().set(layout_key, layoutcache);
    cacheUtilSvc.setCache(layout_key, layoutcache);

    //console.table(loactionlist)
    res.send(layoutcache);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

let arrayToTree = (arr, id, pid) => {
  let data = JSON.parse(JSON.stringify(arr));
  if (!data || !data.length) return [];
  let targetData = []; // container for storing data (return)
  let records = {};
  let itemLength = data.length; //Number of data collections
  for (let i = 0; i < itemLength; i++) {
    let o = data[i];
    records[o[id]] = o;
  }
  for (let i = 0; i < itemLength; i++) {
    let currentData = data[i];
    let parentData = records[currentData[pid]];
    if (!parentData) {
      targetData.push(currentData);
      continue;
    }
    parentData.children = parentData.children || [];
    parentData.children.push(currentData);
  }
  return targetData;
};

module.exports.layoutUpdateOrCreateOrDelete = async (req, res, next) => {
  try {
    logger.info("Query For layoutUpdateOrCreateOrDelete")
    let validation = v.validate(req.body, location_config.locationSchema);
    if (!validation.valid) {
      errorArray = {};
      errorArray.error = validation.errors;
      res.send(errorArray);
    } else {
      action = req.body.action;
      whereclause = { location_id: req.body.location_id };

      let item = null;
      let responsebody = null;

      if (action === "create") {
        item = await Location.create(req.body);
        responsebody = { item, created: true };
      } else if (action === "update") {
        item = await Location.update(req.body, { where: whereclause });
        responsebody = { item, updated: true };
      } else {
        item = await Location.destroy({ where: whereclause });
        responsebody = { item, deleted: true };
      }
      await loadCompleteHirerachyAfterModification(req.body.site_id);
      res.send(responsebody);
    }
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

loadCompleteHirerachyAfterModification = async (siteid) => {
  loactionlist = await Location.findAll({
    raw: true,
    include: [
      {
        model: Site,
        attributes: ["site_name", "city", "site_code"],
      },
    ],
    where: {
      locationxy_coordinate: {
        [Op.not]: null,
      },
      site_id: {
        [Op.eq]: siteid,
      },
    },
  });

  /*   Below 2 line code:-
  Whenever sitecode will be modified then it will set redis key for location layout so that python 
  trackntrace code will take latest effected layout  */
  let [arrList, site_code] = modifyLocationArray(loactionlist);
  cacheUtilSvc.setRedisCacheOnly("loc_detail_" + site_code, arrList);

  layoutcache = arrayToTree(loactionlist, "location_id", "parent_location");
  layout_key = "layout_" + siteid;
  //cacheService.instance().set(layout_key, layoutcache);
  cacheUtilSvc.setCache(layout_key, layoutcache);
};

modifyLocationArray = (locArr) => {
  locCopyArr = _.cloneDeep(locArr);
  var removedArr = _.remove(locCopyArr, (item) => item.is_logical === "F");
  var newArr = _.map(removedArr, function (o) {
    let temp = _.omit(o, "dhl_site.site_name");
    temp = _.omit(temp, "dhl_site.site_code");
    temp = _.omit(temp, "dhl_site.city");
    temp.locationxy_coordinate = temp.locationxy_coordinate.xy;
    return temp;
  });

  return [newArr, locArr[0]["dhl_site.site_code"]];
};

module.exports.siteUpdateWithImages = async (req, res, next) => {
  //console.log(req.body.id)
  //console.log(encode(req.files.image_upload.data))
  // updateqry = "insert into images (data) values ('"+encode(req.files.image_upload.data)+"')"
  // const updaterec = await seqconn.query(updateqry, {
  //   type: QueryTypes.INSERT,
  // });
  if (req.body.id) {
    action = "update";
    whereclause = { id: req.body.id };
  } else {
    action = "create";
  }

  req.body.image = encode(req.files.image_upload.data);
  try {
    if (action === "create") {
      item = await SiteImages.create(req.body);
      responsebody = { created: true };
    } else if (action === "update") {
      item = await SiteImages.update(req.body, { where: whereclause });
      responsebody = { updated: true };
    }
    await getRefreshSite();
    res.send(responsebody);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

module.exports.siteUpdateOrCreate = async (req, res, next) => {
  try {
    action = "";
    if (req.body.site_id) {
      action = "update";
      whereclause = { site_id: req.body.site_id };
    } else {
      action = "create";
    }

    let item = null;
    let responsebody = null;

    if (action === "create") {
      item = await Site.create(req.body, {
        include: [SiteImages],
      });
      responsebody = { item, created: true };
    } else if (action === "update") {
      item = await Site.update(
        req.body,
        {
          include: [SiteImages],
        },
        { where: whereclause }
      );
      responsebody = { item, updated: true };
    }

    await getRefreshSite();

    res.send(responsebody);
  } catch (err) {
    logger.error(err);
    res.send(err);
  }
};

getRefreshSite = async () => {
  try {
    sitelist = await Site.findAll({
      include: [
        {
          model: SiteImages,
          attributes: ["site_id", "image_name", "image"],
        },
      ],
    });

    console.log(sitelist);
    sitecache = JSON.parse(JSON.stringify(sitelist));
    cacheService.instance().set("site", sitecache);
  } catch (err) {
    logger.error(err);
    console.log(err);
  }
};
module.exports.siteMiddleWare = async (req, res, next) => {
  let cacheValue = await cacheUtilSvc.getFromCache("site");
  if (!_.isNil(cacheValue)) {
    res.send(cacheValue);
  } else {
    next();
  }
};

module.exports.layoutMiddleWareForSite = async (req, res, next) => {
  let cacheValue = await cacheUtilSvc.getFromCache("layout_" + req.params.id);
  if (!_.isNil(cacheValue)) {
    res.send(cacheValue);
  } else {
    next();
  }
};
