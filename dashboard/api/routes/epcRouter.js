const express = require("express");
const router = express.Router();

const epcController= require("../controller/epcStateController")

router.get("/all", epcController.getAllEpc);
//router.get("/current/state/siteid/:id", epcController.epcMiddleWare,epcController.getAllEpc);
router.get("/current/state/siteid/:id",epcController.getAllEpc);
router.get("/between/date", epcController.getEpcsBetweenDate);
router.get("/epcid/:id", epcController.getEpc);
router.get("/movement/epcid/:id", epcController.getEpcMovement);
router.post("/shipment/status/update", epcController.updateEpcShippedStatus);


module.exports = router;