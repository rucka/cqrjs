"use strict";
define(['../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.BusService = (function () {

        return {
            ensureIsBusService: function (instance) {
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'BusService', ['start', 'stop', 'getType']);
            }
        };
    }());
});