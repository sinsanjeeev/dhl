const express = require("express");
const router = express.Router();

const userController= require("../controller/userMgmtController")

router.get("/all", userController.getAllUsers);
router.get("/:id", userController.getSelectedUsers);
router.post("/update", userController.userUpdateOrCreateOrDelete);
module.exports = router;