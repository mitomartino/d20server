/**
 * **********************************************************************************************************
 * app.js
 *
 * author: William Martino
 *
 * Main application definition
 *
 * Invoked once per browser connection, performs setup for the application, establishes routes, connects the
 * database, etc.
 *
 * Exports: The application object
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var bodyParser   = require('body-parser');
var validator    = require('express-validator');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var app      = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());

// anything in public directory will be delivered statically
app.use(express.static(path.join(__dirname, 'public')));

// uploads will be delivered statically or redirected if not found
app.use('/upload', express.static(path.join(__dirname, 'upload'), {maxAge: 30000}));

module.exports = app;

// ----------------------------------------------------------------------------------------------------------
// end app.js
// ----------------------------------------------------------------------------------------------------------
