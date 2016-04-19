"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q', 'url'], function (Cqrjs, System, _, Q, url) {
    Cqrjs.namespace("Cqrjs.ServiceBus.BusConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;
    var serviceName = 'ServiceBusConfigurator';

    Cqrjs.ServiceBus.BusConfigurators.ServiceBusConfigurator = (function () {

        var settingsField = System.ComponentModel.PrivateName();
        var builderFactoryField = System.ComponentModel.PrivateName();
        var configuratorsField = System.ComponentModel.PrivateName();
        var endpointFactoryConfiguratorField = System.ComponentModel.PrivateName();
        var subscriptionRouterConfiguratorField = System.ComponentModel.PrivateName();

        function ServiceBusConfigurator(defaultSettings) {
            this[settingsField] = new ServiceBus.BusConfigurators.ServiceBusSettings(defaultSettings);
            this[builderFactoryField] = function (settings) {
                return new ServiceBus.Builders.ServiceBusBuilder(settings);
            };
            this[configuratorsField] = [];

            this[endpointFactoryConfiguratorField] = new ServiceBus.EndpointConfigurators.EndpointFactoryConfigurator(new ServiceBus.EndpointConfigurators.EndpointFactoryDefaultSettings());

            this[subscriptionRouterConfiguratorField] = new ServiceBus.SubscriptionConfigurators.SubscriptionRouterConfigurator(defaultSettings.network);
            this[configuratorsField].push(this[subscriptionRouterConfiguratorField]);
        }

        ServiceBusConfigurator.prototype.receiveFrom = function(uri) {
            this[settingsField].inputAddress = new ServiceBus.Uri(uri);
        };

        ServiceBusConfigurator.prototype.setPurgeOnStartup = function(purgeOnStartup) {
            if(!_(purgeOnStartup).isBoolean()) {
                throw new Error('purgeOnStartup must be provided as boolean');
            }
            this[endpointFactoryConfiguratorField].addEndpointFactoryConfigurator({
                configure : function (builder) {
                    builder.setPurgeOnStartup(purgeOnStartup);
                    return builder;
                },
                validate : function () {
                    return [];
                }
            });
        };

        ServiceBusConfigurator.prototype.addBusConfigurator = function (configurator) {
            System.ComponentModel.Object.prototype.ensureHasMethods(configurator, 'configurator', 'configure');
            this[configuratorsField].push(configurator);
        };

        ServiceBusConfigurator.prototype.addTransportFactory = function (typeFunction, configureAction) {
            //System.ComponentModel.Object.prototype.ensureHasMethods(configurator, 'configurator', 'configure');
            this[endpointFactoryConfiguratorField].addEndpointFactoryConfigurator(new ServiceBus.EndpointConfigurators.TransportFactoryConfigurator(function () {
                var transport = new typeFunction();
                if (_(configureAction).isFunction()) {
                    configureAction(transport);
                }
                return transport;
            }));
        };

        ServiceBusConfigurator.prototype.useMongoDb = function (connectionFactory) {
            this.addTransportFactory(ServiceBus.Transports.MongoDb.MongoDbTransportFactory, function (t) {
                if (!_(connectionFactory).isUndefined()) {
                    t.setConnectionFactory(connectionFactory);
                }
            });
        };

        ServiceBusConfigurator.prototype.subscribe = function (configure) {
            if (!configure || !_(configure).isFunction()) {
                throw new Error ('configure must be provided as function');
            }

            var subscriptionConfigurator = new ServiceBus.SubscriptionConfigurators.SubscriptionBusServiceConfigurator();
            configure(subscriptionConfigurator);
            this.addBusConfigurator(subscriptionConfigurator);
        };

        ServiceBusConfigurator.prototype.createServiceBus = function () {
            log("ServiceBus v" + Cqrjs.package.version + ', node.js v' + process.version);

            var endpointCache = createEndpointCache.call(this);
            this[settingsField].endpointCache = endpointCache;

            var settings = this[settingsField];
            var builderFactory = this[builderFactoryField];
            var builder = builderFactory(settings);
            ServiceBus.Builders.ServiceBusBuilder.ensureIsServiceBusBuilder(builder);

            var subscriptionRouterConfigurator = this[subscriptionRouterConfiguratorField];
            subscriptionRouterConfigurator.setNetwork(settings.network);

            var configurators = this[configuratorsField];

            _(configurators).each(function (configurator) {
                builder = configurator.configure(builder);
                ServiceBus.Builders.ServiceBusBuilder.ensureIsServiceBusBuilder(builder);
            });
            return builder.build();
        };

        function createEndpointCache() {
            if (this[settingsField].endpointCache) {
                return this[settingsField].endpointCache;
            }
            var endpointFactoryConfigurator = this[endpointFactoryConfiguratorField];
            var endpointFactory = endpointFactoryConfigurator.createEndpointFactory();
            ServiceBus.Transports.EndpointFactory.ensureIsEndpointFactory(endpointFactory);
            var endPointCache = new ServiceBus.Transports.EndpointCache(endpointFactory);
            return endPointCache;
        }

        ServiceBusConfigurator.prototype.validate = function () {
            var validationResults = [];

            if (!this[builderFactoryField]) {
                validationResults.push(failure('builderFactory', 'The builder factory cannot be undefined'));
            }

            if (!this[settingsField].inputAddress) {
                validationResults.push(failure('inputAddress', 'The "InputAddress" is null.'));
            }

            _(this[endpointFactoryConfiguratorField].validate()).each(function (e) {
                e.key = 'endpointFactory.' + e.key;
                validationResults.push(e);
            });

            _(this[configuratorsField]).each(function (c) {
                validationResults.concat(c.validate());
            });

            validationResults.concat(this[subscriptionRouterConfiguratorField].validate());

            return validationResults;
        };

        function failure (key, msg) {
            return new ServiceBus.Configurators.ValidationResult(ServiceBus.Configurators.ValidationResultDescription.Failure, key, null, msg);
        }

        function log (message, level, category, metadata) {
            System.ComponentModel.logger.log(message, level, serviceName, category, metadata);
        }

        function logdebug (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'debug', serviceName, category, metadata);
        }

        function logverbose (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'verbose', serviceName, category, metadata);
        }

        function logwarn (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'warn', serviceName, category, metadata);
        }

        function logerror (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'err', serviceName, category, metadata);
        }

        return ServiceBusConfigurator;
    }());
});