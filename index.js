var express = require("express");
var router = express.Router();
var config = require("../config"); // Correctly importing config

/* GET home page. */
router.get("/", function (req, res, next) {
  console.debug("Config App:", config.app); // Debugging line
  res.render("index", {
    title: config.app.hotel_name,
    menuTitle: config.app.hotel_name,
  });
});

module.exports = router;
