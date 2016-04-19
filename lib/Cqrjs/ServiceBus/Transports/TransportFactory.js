"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.TransportFactory = (function () {
        return {
            ensureIsTransportFactory : function (instance) {
                System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'transportFactory', ['scheme'/*, 'messageNameFormatter'*/]);
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'transportFactory', ['buildLoopback', 'buildInbound', 'buildOutbound', 'buildError']);
            }
        };
    }());
});