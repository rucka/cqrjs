"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.EndpointConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.EndpointConfigurators.TransportFactoryConfigurator = (function () {
        var transportFactoryField = System.ComponentModel.PrivateName();

        function TransportFactoryConfigurator(transportFactory) {
            if (!_(transportFactory).isFunction()) {
                throw new Error('expected provided transportFactory as function');
            }

            this[transportFactoryField] = transportFactory;
        }

        TransportFactoryConfigurator.prototype.configure = function (builder) {
            var transportFactory = this[transportFactoryField]();

            if (_(transportFactory).isUndefined()){
                throw new Error("A transport factory was not created");
            }
            builder.addTransportFactory(transportFactory);
            return builder;
        };

        TransportFactoryConfigurator.prototype.validate = function () {
            var validationResults = [];

            if (!_(this[transportFactoryField]).isFunction()) {
                validationResults.push(failure("TransportFactory", "The transport factory was null. This should have been in the ctor."));
            }

            return validationResults;
        };

        function failure (key, msg) {
            return new ServiceBus.Configurators.ValidationResult(ServiceBus.Configurators.ValidationResultDescription.Failure, key, null, msg);
        }
        return TransportFactoryConfigurator;
    }());
});