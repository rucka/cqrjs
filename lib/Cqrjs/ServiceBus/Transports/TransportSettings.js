"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.TransportSettings = (function () {

        function TransportSettings(endpointAddress, settings) {
            ServiceBus.EndpointAddress.ensureIsEndpointAddress(endpointAddress);
            if (settings) {ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(settings);}

            Object.defineProperty(this, 'address', {
                enumerable: true,
                writable: false,
                value: endpointAddress
            });

            this.transactional = settings? settings.transactional : endpointAddress.isTransactional;
            this.requireTransactional = settings? settings.requireTransactional : false;
            this.transactionTimeout = settings? settings.transactionTimeout : 30000;
            this.isolationLevel = settings? settings.v : null;
            this.createIfMissing = settings? settings.createIfMissing : true;
            this.purgeExistingMessages = settings? settings.purgeExistingMessages : false;
        }

        TransportSettings.ensureIsTransportSettings = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'TransportSettings', ['address', 'transactional', 'requireTransactional', 'transactionTimeout', 'createIfMissing', 'purgeExistingMessages']);
            ServiceBus.EndpointAddress.ensureIsEndpointAddress(instance.address);
        };

        return TransportSettings;
    }());
});