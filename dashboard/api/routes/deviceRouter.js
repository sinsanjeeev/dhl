const express = require("express");
const router = express.Router();

const deviceController= require("../controller/deviceStateController")

router.get("/status/site/:id", deviceController.getDeviceForSite);

module.exports = router;