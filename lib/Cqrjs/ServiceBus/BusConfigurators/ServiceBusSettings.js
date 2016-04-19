"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.BusConfigurators");
    Cqrjs.ServiceBus.BusConfigurators.ServiceBusSettings = (function () {
        var ServiceBus = Cqrjs.ServiceBus;

        function ServiceBusSettings(settings) {
            ServiceBus.BusConfigurators.ServiceBusDefaultSettings.ensureIsServiceBusDefaultSettings(settings);

            this.autoStart = settings.autoStart;
            this.receiveTimeout = settings.receiveTimeout;
            this.concurrentReceiverLimit = settings.concurrentReceiverLimit;
            this.concurrentConsumerLimit = settings.concurrentConsumerLimit;
            this.network = settings.network;
            this.endpointCache = settings.endpointCache;
            this.inputAddress = null;
            this.beforeConsume = null;
            this.afterConsume = null;
        }

        ServiceBusSettings.ensureIsServiceBusSettings = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'busSettings', ['autoStart', 'concurrentConsumerLimit', 'concurrentReceiverLimit', 'receiveTimeout', 'network', 'inputAddress']);
            if (instance.beforeConsume) {
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'busSettings', ['beforeConsume']);
            }

            if (instance.afterConsume) {
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'busSettings', ['afterConsume']);
            }

            ServiceBus.Uri.ensureIsUri(instance.inputAddress);
        };

        return ServiceBusSettings;
    }());
});