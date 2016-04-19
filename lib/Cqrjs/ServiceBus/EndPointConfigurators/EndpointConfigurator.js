"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.EndpointConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.EndpointConfigurators.EndpointConfigurator = (function () {
        var settingsField = System.ComponentModel.PrivateName();
        var uriField = System.ComponentModel.PrivateName();
        var errorAddressField = System.ComponentModel.PrivateName();
        var transportFactoryField = System.ComponentModel.PrivateName();
        var errorTransportFactoryField = System.ComponentModel.PrivateName();

        function EndpointConfigurator(uri, defaultSettings) {
            if (!defaultSettings) {
                throw new Error('expected provided defaultSettings');
            }

            ServiceBus.Uri.ensureIsUri(uri);
            this[uriField] = uri;

            ServiceBus.EndpointConfigurators.EndpointFactoryDefaultSettings.ensureIsEndpointFactoryDefaultSettings(defaultSettings);
            this[settingsField] = defaultSettings.createEndPointSettings(uri);

            this[transportFactoryField] = function (transportFactory, settings) {
                ServiceBus.Transports.TransportFactory.ensureIsTransportFactory(transportFactory);
                ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(settings);
                return transportFactory.buildLoopback(settings);
            };

            this[errorTransportFactoryField] = function (transportFactory, settings) {
                ServiceBus.Transports.TransportFactory.ensureIsTransportFactory(transportFactory);
                ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(settings);
                return transportFactory.buildError(settings);
            };
        }

        EndpointConfigurator.prototype.useSerializer = function (serializer) {
            throw new Error('useSerializer not supported');
        };


        EndpointConfigurator.prototype.setErrorAddress = function (uri) {
            this[errorAddressField] = new ServiceBus.EndpointAddress(uri);
        };


        EndpointConfigurator.prototype.setTransportFactory = function (transportFactory) {
            throw new Error('setTransportFactory not implemented');
        };


        EndpointConfigurator.prototype.setErrorTransportFactory = function (errorTransportFactory) {
            throw new Error('setErrorTransportFactory not implemented');
        };


        EndpointConfigurator.prototype.purgeExistingMessages = function () {
            throw new Error('useSerializer not implemented');
        };

        EndpointConfigurator.prototype.createTransactional = function () {
            throw new Error('createTransactional not supported');
        };


        EndpointConfigurator.prototype.createIfMissing = function () {
            throw new Error('createIfMissing not implemented');
        };


        EndpointConfigurator.prototype.setMessageRetryLimit = function (retryLimit) {
            throw new Error('setMessageRetryLimit not implemented');
        };


        EndpointConfigurator.prototype.setInboundMessageTrackerFactory = function (messageTrackerFactory) {
            throw new Error('setInboundMessageTrackerFactory not supported');
        };


        EndpointConfigurator.prototype.setTransactionTimeout = function (timeout) {
            throw new Error('setTransactionTimeout not implemented');
        };


        EndpointConfigurator.prototype.setIsolationLevel = function (isolationLevel) {
            throw new Error('setIsolationLevel not supported');
        };

        EndpointConfigurator.prototype.createBuilder = function () {
            var errorAddress = this[errorAddressField];
            var settings = this[settingsField];

            var errorSettings = new ServiceBus.Transports.TransportSettings(errorAddress ? errorAddress : settings.errorAddress, settings);

            var uri = this[uriField];
            var settings = this[settingsField];
            var transportFactory = this[transportFactoryField];
            var errorTransportFactory = this[errorTransportFactoryField];

            var trackerFactory = function () {
                return settings.trackerFactory(settings.retryLimit);
            };

            var endpointBuilder = new ServiceBus.Builders.EndpointBuilder(uri, settings, errorSettings, transportFactory, errorTransportFactory, trackerFactory);
            return endpointBuilder;
        };

        EndpointConfigurator.prototype.configure = function (builder) {
            ServiceBus.Builders.EndpointFactoryBuilder.ensureIsEndpointFactoryBuilder(builder);
            var endpointBuilder = this.createBuilder();
            builder.addEndpointBuilder(this[uriField], endpointBuilder);
            return builder;
        };

        EndpointConfigurator.prototype.validate = function () {
            var validationResults = [];
            throw new Error('validate not yet implemented');
            return validationResults;
        };

        function failure (key, msg) {
            return new ServiceBus.Configurators.ValidationResult(ServiceBus.Configurators.ValidationResultDescription.Failure, key, null, msg);
        }

        EndpointConfigurator.ensureIsEndpointConfigurator = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'endpointConfigurator', ['configure', 'validate','useSerializer', 'setErrorAddress', 'setTransportFactory', 'setErrorTransportFactory', 'purgeExistingMessage', 'createTransactional', 'createIfMissing', 'setMessageRetryLimit', 'setInboundMessageTrackerFactory', 'setTransactionTimeout', 'setIsolationLevel']);
        };

        return EndpointConfigurator;
    }());
});