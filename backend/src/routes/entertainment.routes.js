// PROJO GROUP — Entertainment Routes
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const entertainment = require("../controllers/entertainment.controller");

// Public (auth required)
router.get("/ads",  authenticate, entertainment.getAds);
router.post("/ads", authenticate, entertainment.submitAd);

// Classifieds
router.get("/classifieds",              authenticate, entertainment.getClassifieds);
router.get("/classifieds/mine",         authenticate, entertainment.myClassifieds);
router.post("/classifieds",             authenticate, entertainment.postClassified);
router.put("/classifieds/:id/mark-sold",authenticate, entertainment.markSold);
router.delete("/classifieds/:id",        authenticate, entertainment.deleteClassified);
router.post("/classifieds/:id/renew",    authenticate, entertainment.renewClassified);

// Digital Marketplace
const marketplace = require("../controllers/digitalMarketplace.controller");
router.get("/digital-products",                  authenticate, marketplace.getDigitalProducts);
router.post("/digital-products/:id/purchase",    authenticate, marketplace.purchaseDigitalProduct);
router.get("/digital-products/:id/download",     authenticate, marketplace.downloadDigitalProduct);
router.get("/my-purchases",                      authenticate, marketplace.getMyPurchases);

module.exports = router;
