const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

router.get('/search', siteController.search);

router.use('/customer', siteController.customer);
router.use('/searchcustomer', siteController.searchcustomer);
router.use('/addcustomer', siteController.addcustomer);
router.use('/editcustomer/:id', siteController.editcustomer);
router.use('/editcustomer/:id', siteController.updatecustomer);
router.use('/delete', siteController.delete);
router.use('/order', siteController.order);
router.use('/product', siteController.product);
router.use('/', siteController.index);

module.exports = router;
