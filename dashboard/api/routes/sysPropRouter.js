const express = require("express");
const router = express.Router();

const propController= require("../controller/sysPropController")

router.get("/all", propController.getAllSysProps);
router.post("/update", propController.propUpdateOrCreateOrDelete);
router.get("/site/:id", propController.sysPropMiddleWare,propController.getSysPropsForSite);

module.exports = router;