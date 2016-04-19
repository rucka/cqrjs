"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.EndpointCache = (function () {
        var serviceName = 'EndpointCache';

        var endpointFactoryField = System.ComponentModel.PrivateName();
        var endpointsField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function EndpointCache(endpointFactory) {
            ServiceBus.Transports.EndpointFactory.ensureIsEndpointFactory(endpointFactory);

            this[endpointFactoryField] = endpointFactory;
            this[endpointsField] = {};
            this[disposedField] = false;
        }

        EndpointCache.prototype.getEndpoint = function (uri) {
            try {
                ServiceBus.Uri.ensureIsUri(uri);
                var key = uri.toString().toLowerCase();
                var endpoints = this[endpointsField];
                var endpointFactory = this[endpointFactoryField];

                if (_(endpoints[key]).isUndefined()) {
                    var endpoint = endpointFactory.createEndpoint(key);
                    ServiceBus.Transports.Endpoint.ensureIsEndpoint(endpoint);
                    endpoints[key] = endpoint;
                }
                return endpoints[key];

            } catch (e) {
                if (e.getType && (e.getType() === 'TransportException' || e.getType() === 'EndpointException')) {
                    throw e;
                }
                var error = new Error('Configuration error: An exception was thrown retrieving the endpoint:' + uri.toString());
                error.innerError = e;
                throw error;
            }
        };

        EndpointCache.prototype.clear = function () {
            var endpoints = _(this[endpointsField]).clone();
            this[endpointsField] = {};

            _(this[endpointsField]).each(function (ep) {
                try {
                    ep.dispose();
                }   catch (e) {
                    logerror("An exception was thrown while disposing of an endpoint: " + this.endpoint.address.toString() + '. Error: ' + e.message);
                }
            });
        };

        EndpointCache.prototype.inspect = function (probe) {
            throw new Error('inspect not yet implemented');
        };

        EndpointCache.prototype.dispose = function () {
            if (this[disposedField]) {
                return;
            }

            this.clear();
            this[endpointFactoryField].dispose();

            this[disposedField] = true;
        };

        EndpointCache.ensureIsEndpointCache = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'endPointCache', ['inspect', 'getEndpoint','clear']);
        };

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

        return EndpointCache;
    }());
});