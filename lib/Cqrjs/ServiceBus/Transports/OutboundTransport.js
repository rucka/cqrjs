"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.OutboundTransport = (function () {

        function OutboundTransport() {
        }

        OutboundTransport.ensureIsOutboundTransport = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'OutboundTransport', ['send']);
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'OutboundTransport', 'address');
        };

        return OutboundTransport;
    }());
});