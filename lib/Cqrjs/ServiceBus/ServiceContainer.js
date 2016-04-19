"use strict";
define(['../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.ServiceContainer = (function () {
        var serviceName = 'ServiceContainer';
        var busField = System.ComponentModel.PrivateName();
        var catalogField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function ServiceContainer(bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            this[busField] = bus;
            this[catalogField] = {};
            this[disposedField] = false;
        }

        ServiceContainer.prototype.addService = function (layer, service) {
            var layerName = _.invert(ServiceBus.BusServiceLayer)[layer];

            if (_(layerName).isUndefined()) {
                throw new Error('Invalid layer');
            }

            ServiceBus.BusService.ensureIsBusService(service);
            this[catalogField][layerName] = service;
        };

        ServiceContainer.prototype.getService = function (serviceType) {
            return _.invert(this[catalogField]).find(function (service) {
                return service.getType() === serviceType;
            });
        };

        ServiceContainer.prototype.start = function () {
            var started = [];
            var bus = this[busField];
            var catalog = this[catalogField];

            _(catalog).each(function (service, layer) {
                try {
                    var servicetype = service.getType && _(service.getType).isFunction() ? service.getType() : 'service';
                    logdebug('Starting bus service ' + servicetype);
                    service.start(bus);
                    started.push(service);
                } catch(e) {
                    logerror('Failed to start bus service ' + servicetype);
                    _(started).each(function (stopService) {
                        var stopservicetype = stopService.getType && _(stopService.getType).isFunction() ? stopService.getType() : 'service';
                        try{
                            stopService.stop();
                        } catch (stope) {
                            logwarn('"Failed to stop a service that was started during a failed bus startup: ' + stopservicetype);
                        }
                    });
                    var error = new Error('Failed to start bus services');
                    error.innerError = e;
                    throw error;
                }
            });
        };

        ServiceContainer.prototype.stop = function () {
            _.chain(this[catalogField]).//TODO: reverse items
                each(function (service) {
                try{
                    service.stop();
                } catch (stope) {
                    logerror('"Failed to stop a service: ' + service.getType());
                }
            });
        };

        ServiceContainer.prototype.inspect = function () {
            throw new Error ('inspect not yet implemented');
        };

        ServiceContainer.prototype.dispose = function () {
            if (this[disposedField]) {
                return;
            }

            _.chain(this[catalogField]).//TODO: reverse items
                each(function (service) {
                    service.dispose();
            });
            this[disposedField] = true;
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

        return ServiceContainer;
    }());
});