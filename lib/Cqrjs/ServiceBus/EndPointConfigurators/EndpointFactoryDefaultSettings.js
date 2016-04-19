"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.EndpointConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.EndpointConfigurators.EndpointFactoryDefaultSettings = (function () {

        function EndpointFactoryDefaultSettings() {
            this.createMissingQueues = true;
            this.createTransactionalQueues = false;
            this.purgeOnStartup = false;
            this.requireTransactional = false;
            this.serializer = new ServiceBus.Serializers.JsonSerializer();
            this.transactionTimeout = 30000;
            this.isolationLevel = null;//IsolationLevel.Serializable;
            this.retryLimit = 5;
            this.trackerFactory = function (retryLimit) {
                return new ServiceBus.Transports.InboundMessageTracker(retryLimit);
            };
        }

        EndpointFactoryDefaultSettings.prototype.createEndPointSettings = function (uri) {
            ServiceBus.Uri.ensureIsUri(uri);
            var settings = new ServiceBus.Transports.EndpointSettings(uri);
            settings.serializer = this.serializer;
            settings.createIfMissing = this.createMissingQueues;
            settings.transactionTimeout = this.transactionTimeout;
            settings.purgeExistingMessages = this.purgeOnStartup;
            settings.requireTransactional = this.requireTransactional;
            settings.isolationLevel = this.isolationLevel;
            settings.transactional = this.createTransactionalQueues;
            settings.retryLimit = this.retryLimit;
            settings.trackerFactory = this.trackerFactory;
            return settings;
        };

        EndpointFactoryDefaultSettings.ensureIsEndpointFactoryDefaultSettings = function(instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'endpointFactoryDefaultSettings', ['createMissingQueues', 'createTransactionalQueues','purgeOnStartup' ,'requireTransactional','serializer','transactionTimeout','isolationLevel','retryLimit']);
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'endpointFactoryDefaultSettings', ['createEndPointSettings', 'trackerFactory']);
        };

        return EndpointFactoryDefaultSettings;
    }());
});