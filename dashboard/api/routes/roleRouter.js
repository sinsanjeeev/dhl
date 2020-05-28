const express = require("express");
const router = express.Router();

const roleController= require("../controller/roleController")

router.get("/all", roleController.getAllRoles);
router.get("/module/all", roleController.getAllModule);
router.post("/update", roleController.roleUpdateOrCreateOrDelete);

module.exports = router;