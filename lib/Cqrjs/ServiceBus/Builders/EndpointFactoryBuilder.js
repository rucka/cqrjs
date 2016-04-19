"use strict";
define(['../../../root', 'mdcore', 'underscore', 'url'], function (Cqrjs, System, _, url) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Builders");

    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.Builders.EndpointFactoryBuilder = (function () {
        var endpointBuildersField = System.ComponentModel.PrivateName();
        var transportFactoriesField = System.ComponentModel.PrivateName();
        var defaultsField = System.ComponentModel.PrivateName();

        function EndpointFactoryBuilder(defaults) {
            if (!defaults) {
                throw new Error('Expected defaults paramenter');
            }

            this[endpointBuildersField] = {};
            this[transportFactoriesField] = {};

            this.addTransportFactory(new ServiceBus.Transports.Loopback.LoopbackTransportFactory());
            this[defaultsField] = new ServiceBus.EndpointConfigurators.EndpointFactoryDefaultSettings(defaults);
        }

        EndpointFactoryBuilder.prototype.build = function () {
            var endpointFactory = new ServiceBus.Transports.EndpointFactory(this[transportFactoriesField], this[endpointBuildersField], this[defaultsField]);
            return endpointFactory;
        };

        EndpointFactoryBuilder.prototype.setDefaultSerializer = function (defaultSerializer) {
            throw new Error ('setDefaultSerializer not supported');
            //_defaults.Serializer = defaultSerializer;
        };

        EndpointFactoryBuilder.prototype.setDefaultTransactionTimeout = function (transactionTimeout) {
            if (!_(transactionTimeout).isNumber()) {
                throw new Error('expected a number');
            }
            this[defaultsField].transactionTimeout = transactionTimeout;
        };

        EndpointFactoryBuilder.prototype.setDefaultIsolationLevel = function (isolationLevel) {
            throw new Error ('setDefaultIsolationLevel not supported');
            // this[defaultsField].isolationLevel = isolationLevel;
        };

        EndpointFactoryBuilder.prototype.setDefaultRetryLimit = function (retryLimit) {
             if (!_(retryLimit).isNumber()) {
                throw new Error('expected a number');
             }
             this[defaultsField].retryLimit = retryLimit;
        };

        EndpointFactoryBuilder.prototype.setDefaultInboundMessageTrackerFactory = function (messageTrackerFactory) {
            this[defaultsField].trackerFactory = messageTrackerFactory;
        };

        EndpointFactoryBuilder.prototype.setCreateMissingQueues = function(createMissingQueues) {
            if (!_(createMissingQueues).isBoolean()) {
                throw new Error('expected a boolean');
            }
            this[defaultsField].createMissingQueues = createMissingQueues;
        };

        EndpointFactoryBuilder.prototype.setCreateTransactionalQueues = function (createTransactionalQueues) {
            if (!_(createTransactionalQueues).isBoolean()) {
                throw new Error('expected a boolean');
            }
            this[defaultsField].createTransactionalQueues = createTransactionalQueues;
        };

        EndpointFactoryBuilder.prototype.setPurgeOnStartup = function (purgeOnStartup) {
            if (!_(purgeOnStartup).isBoolean()) {
                throw new Error('expected a boolean');
            }
            this[defaultsField].purgeOnStartup = purgeOnStartup;
        };

        EndpointFactoryBuilder.prototype.addEndpointBuilder = function (uri, endpointBuilder) {
             var u = ServiceBus.Uri.isUri(uri) ? uri : new ServiceBus.Uri(uri);
            this[endpointBuildersField][uri.toString()] = endpointBuilder;
        };

        EndpointFactoryBuilder.prototype.addTransportFactory = function (transportFactory) {
            ServiceBus.Transports.TransportFactory.ensureIsTransportFactory(transportFactory);
            var scheme = transportFactory.scheme.toLocaleLowerCase();
            this[transportFactoriesField][scheme] = transportFactory;
        };

        EndpointFactoryBuilder.ensureIsEndpointFactoryBuilder = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'builder', ['build','setDefaultSerializer','setDefaultTransactionTimeout','setCreateMissingQueues','setCreateTransactionalQueues','setPurgeOnStartup','addEndpointBuilder','addTransportFactory','setDefaultIsolationLevel','setDefaultRetryLimit','setDefaultInboundMessageTrackerFactory']);
        };

        return EndpointFactoryBuilder;
    }());
});