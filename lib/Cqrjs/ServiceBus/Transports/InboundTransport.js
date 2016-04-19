"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.InboundTransport = (function () {

        function InboundTransport() {
        }

        InboundTransport.ensureIsInboundTransport = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'InboundTransport', ['receive']);
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'InboundTransport', 'address');
        };

        return InboundTransport;
    }());
});