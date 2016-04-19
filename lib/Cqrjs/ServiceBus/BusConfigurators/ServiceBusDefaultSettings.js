"use strict";
define(['../../../root', 'mdcore', 'os'], function (Cqrjs, System, os) {
    Cqrjs.namespace("Cqrjs.ServiceBus.BusConfigurators");
    Cqrjs.ServiceBus.BusConfigurators.ServiceBusDefaultSettings = (function () {

        function ServiceBusDefaultSettings() {
            this.autoStart = true;
            this.receiveTimeout = '3000';
            this.concurrentReceiverLimit = 1;
            this.concurrentConsumerLimit = os.cpus().length * 4;
            this.network = os.hostname();
        }

        ServiceBusDefaultSettings.ensureIsServiceBusDefaultSettings = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'settings', ['autoStart', 'concurrentConsumerLimit', 'concurrentReceiverLimit', 'receiveTimeout', 'network']);
        };

        return ServiceBusDefaultSettings;
    }());
});