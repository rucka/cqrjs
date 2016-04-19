"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Builders");

    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.Builders.ServiceBusBuilder = (function () {
        var busServiceConfiguratorsField = System.ComponentModel.PrivateName();
        var postCreationActionsField = System.ComponentModel.PrivateName();

        function ServiceBusBuilder(busSettings) {
            ServiceBus.BusConfigurators.ServiceBusSettings.ensureIsServiceBusSettings(busSettings);

            Object.defineProperty(this, 'settings', {
                enumerable : true,
                writable: false,
                value: _(busSettings).clone()
            });
            this[busServiceConfiguratorsField] = [];
            this[postCreationActionsField] = [];
        }

        ServiceBusBuilder.prototype.build = function () {
            var serviceBus = createServiceBus(this.settings);

            configureBusSettings(serviceBus, this.settings);
            runPostCreateActions(this[postCreationActionsField]);
            configureMessageInterceptor(serviceBus, this.settings);
            runBusServiceConfiguration(serviceBus, this[busServiceConfiguratorsField]);

            if (this.settings.autoStart) {
                serviceBus.start();
            }

            return serviceBus;
        };

        function createServiceBus(settings) {
            var endpointCache = settings.endpointCache;
            var endpoint = endpointCache.getEndpoint(settings.inputAddress);
            return new ServiceBus.ServiceBus(endpoint, endpointCache);
        }

        function configureBusSettings(bus, settings) {
            bus.receiveTimeout = settings.receiveTimeout;
        }

        function runPostCreateActions(bus, actions) {
            _(actions).each(function(action) {
                action(bus);
            });
        }

        function configureMessageInterceptor(bus, settings) {
            if (!settings.beforeConsume && !settings.afterConsume) {
                return;
            }
            throw new Error('message interceptor not supported');
        }

        function runBusServiceConfiguration(bus, busServiceConfigurators) {
            _(busServiceConfigurators).each(function (busServiceConfigurator) {
                try {
                    var busService = busServiceConfigurator.create(bus);
                    bus.addService(busServiceConfigurator.layer, busService);
                } catch(e) {
                    var error = new Error('Failed to create the bus service: ' + busServiceConfigurator.serviceType);
                    error.innerError = e;
                    error.getType = function () {return 'ConfigurationError';};
                    throw error;
                }
            });
        }

        ServiceBusBuilder.prototype.useControlBus = function (controlBus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(controlBus);
            this[postCreationActionsField].push(function(bus){
                bus.controlBus = controlBus;
            });
        };

        ServiceBusBuilder.prototype.addPostCreateAction = function (postCreateAction) {
            if (!_(postCreateAction).isFunction()) {
                throw new Error('Expected a function as post create action');
            }
            this[postCreationActionsField].push(postCreateAction);
        };

        ServiceBusBuilder.prototype.addBusServiceConfigurator = function (configurator) {
            ServiceBus.BusServiceConfigurators.BusServiceConfigurator.ensureIsBusServiceConfigurator(configurator);
            this[busServiceConfiguratorsField].push(configurator);
        };

        ServiceBusBuilder.prototype.match = function (callback) {
            throw new Error ('match not yet implemented');
        };

        ServiceBusBuilder.ensureIsServiceBusBuilder = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'busBuilder', 'settings');
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'busBuilder', ['build', 'addPostCreateAction', 'addBusServiceConfigurator', 'match']);
        };

        return ServiceBusBuilder;
    }());
});