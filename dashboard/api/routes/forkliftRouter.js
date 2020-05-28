const express = require("express");
const router = express.Router();

const forkliftController= require("../controller/forkliftStateController")
router.get("/current/state/siteid/:id", forkliftController.getAllForklift);
router.get("/movement", forkliftController.getForkliftMovement);
module.exports = router;