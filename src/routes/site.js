const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

router.get('/search', siteController.search);
router.use('/add', siteController.add);
router.use('/delete', siteController.delete);
router.use('/order', siteController.order);
router.use('/product', siteController.product);
router.use('/', siteController.index);

module.exports = router;
