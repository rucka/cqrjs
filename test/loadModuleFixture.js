var Cqrjs = require('../main.js');
var _ = require('underscore');
var Q = require('q');

this.LoadModule = (function () {
    "use strict";
    return {
        "configured Cqrjs": function (test) {
            test.expect(1);
            test.ok(Cqrjs);
            test.done();
        },
        "configured Cqrjs.EventStore": function (test) {
            test.expect(1);
            test.ok(Cqrjs.EventStore);
            test.done();
        },
        "configured global functions": function (test) {
            test.expect(3);
            test.ok(_);
            test.ok(_.str);
            test.ok(Q);
            test.done();
        }
    };
}());