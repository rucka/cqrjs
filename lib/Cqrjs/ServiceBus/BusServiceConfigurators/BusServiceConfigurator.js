"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.BusServiceConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.BusServiceConfigurators.BusServiceConfigurator = (function () {
        return {
            ensureIsBusServiceConfigurator : function (instance) {
                System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'busServiceConfigurator', ['serviceType', 'layer']);
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'busServiceConfigurator', ['create']);
            }
        };
    }());
});