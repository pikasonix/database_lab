const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

router.get('/search', siteController.search);

router.use('/customer', siteController.customer);
router.use('/searchcustomer', siteController.searchcustomer);
router.use('/addcustomer', siteController.addcustomer);
router.use('/editcustomer/:id', siteController.editcustomer);
router.use('/updatecustomer/:id', siteController.updatecustomer);
router.use('/deletecustomer/:id', siteController.deletecustomer); // hiển thị trang deletecustomer
router.use('/removecustomer/:id', siteController.removecustomer); // xoá customer

router.use('/product', siteController.product);
router.get('/supplier', siteController.supplier);
router.use('/addproduct', siteController.addproduct);
router.use('/editproduct/:id', siteController.editproduct);
router.use('/updateproduct/:id', siteController.updateproduct);
router.use('/deleteproduct/:id', siteController.deleteproduct); // hiển thị trang deletecustomer
router.use('/removeproduct/:id', siteController.removeproduct); // xoá customer


router.use('/delete', siteController.delete);
router.use('/order', siteController.order);
router.use('/product', siteController.product);
router.use('/', siteController.index);

module.exports = router;
