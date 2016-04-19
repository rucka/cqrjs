"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus");

    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.Transports.EndpointFactory = (function () {
        var transportFactoriesField = System.ComponentModel.PrivateName();
        var endpointBuildersField = System.ComponentModel.PrivateName();
        var defaultsField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function EndpointFactory(transportFactories, endpointBuilders, defaults) {
            if (!transportFactories) throw new Error("transportFactories not provided");
            if (!endpointBuilders) throw new Error("endpointBuilders not provided");
            if (!defaults) throw new Error("defaults not provided");

            this[disposedField] = false;

            _(transportFactories).each(function(transportFactory, key) {
                if (!_(key).isString()) {
                    throw new Error('transportFactories contains some key not string');
                }
                ServiceBus.Transports.TransportFactory.ensureIsTransportFactory(transportFactory);
            });

            _(endpointBuilders).each(function(endpointBuilder, uri) {
                if (!_(uri).isString()) {
                    throw new Error('transportFactories contains some key not string');
                }
                ServiceBus.Uri.ensureIsUri(uri);
                ServiceBus.Builders.EndpointBuilder.ensureIsEndpointBuilder(endpointBuilder);
            });
            ServiceBus.EndpointConfigurators.EndpointFactoryDefaultSettings.ensureIsEndpointFactoryDefaultSettings(defaults);
            this[transportFactoriesField] = transportFactories;
            this[endpointBuildersField] = endpointBuilders;
            this[defaultsField] = defaults;
        }

        EndpointFactory.prototype.createEndpoint = function (url) {
            ServiceBus.Uri.ensureIsUrl(url);
            var uri = new ServiceBus.Uri(url);
            var scheme = uri.scheme.toLowerCase();
            var transportFactories = this[transportFactoriesField];
            var transportFactory = transportFactories[scheme];
            var defaults = this[defaultsField];

            if (transportFactory) {
                try {
                    var endpointBuilders = this[endpointBuildersField];
                    if (_(endpointBuilders[uri.toString()]).isUndefined()) {
                        var configurator = new ServiceBus.EndpointConfigurators.EndpointConfigurator(uri, defaults);
                        endpointBuilders[uri.toString()] = configurator.createBuilder();
                    }
                    var builder = endpointBuilders[uri.toString()];
                    return builder.createEndpoint(transportFactory);
                } catch (e) {
                    var error = new Error('Failed to create endpoint to address: ' + uri.toString());
                    error.innerError = e;
                    error.getType = function () {return 'EndpointError';};
                    throw error;
                }
            }
            throw new Error("The " + scheme + " scheme was not handled by any registered transport.");
        };

        EndpointFactory.prototype.inspect = function (probe) {
            throw new Error('inspect not yet implemented');
        };

        EndpointFactory.prototype.addTransportFactory = function (factory) {
            ServiceBus.Transports.TransportFactory.ensureIsTransportFactory(factory);
            var scheme = factory.scheme.toLowerCase();
            this[transportFactoriesField][scheme] = factory;
        };

        EndpointFactory.prototype.dispose = function () {
            if (this[disposedField]) {
                return;
            }

            _(this[transportFactoriesField]).each(function (t){
                t.dispose();
            });

            this[disposedField] = true;
        };

        EndpointFactory.ensureIsEndpointFactory = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'endpointFactory', ['inspect', 'addTransportFactory','createEndpoint']);
        };

        return EndpointFactory;
    }());
});