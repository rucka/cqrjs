"use strict";
require('mdcore');
require('joeventstore');
var pkg = require('./package.json');

var requireJs = require('requirejs');

requireJs.config({
    baseUrl: require('path').join(__dirname, 'lib'),
    nodeRequire: require
});

module.exports = requireJs('loader');
module.exports.package = pkg;