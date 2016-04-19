"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.DuplexTransport = (function () {

        function DuplexTransport() {
        }

        DuplexTransport.ensureIsDuplexTransport = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'DuplexTransport', ['inboundTransport', 'outboundTransport']);
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'DuplexTransport', ['dispose']);
            ServiceBus.Transports.InboundTransport.ensureIsInboundTransport(instance);
            ServiceBus.Transports.OutboundTransport.ensureIsOutboundTransport(instance);
        };

        return DuplexTransport;
    }());
});