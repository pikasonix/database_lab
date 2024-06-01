const express = require('express');
const morgan = require('morgan');
const handlebars = require('express-handlebars');
const helpers = require('handlebars-helpers');
const comparison = helpers.comparison();

const Handlebars = require('handlebars');
const MomentHandler = require('handlebars.moment');
MomentHandler.registerHelpers(Handlebars);

const path = require('path');
const app = express();
const port = 2000;

const route = require('./routes');
const db = require('./config/db'); // [#1]

// Use Image
app.use(express.static(path.join(__dirname, 'public')));

// Connect to db    // [#1]
db.connect();

//
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// HTTP logger
app.use(morgan('tiny'));

// Template engine
app.engine('hbs', handlebars.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

// Routes init
route(app);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
