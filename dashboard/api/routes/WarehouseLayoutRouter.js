const express = require("express");
const router = express.Router();

const layoutController= require("../controller/layoutController")

router.get("/sitelocation/siteid/:id", layoutController.getLocation);
//router.get("/site", warehouseLayoutModel.loadSiteCoordinate);
router.get("/site",layoutController.siteMiddleWare,layoutController.getSite);
router.get("/hierarchy/siteid/:id",layoutController.layoutMiddleWareForSite,layoutController.getCompleteLocationHierarchy);
router.get("/hierarchy/sublocation/siteid/:id",layoutController.getSubLocationHierarchy);
//router.get("/hierarchy/all",layoutController.getCompleteLocationHierarchy);
router.post("/sitelocation/update", layoutController.layoutUpdateOrCreateOrDelete);
router.post("/siteimage/update", layoutController.siteUpdateWithImages);
router.post("/site/update", layoutController.siteUpdateOrCreate);

module.exports = router;
