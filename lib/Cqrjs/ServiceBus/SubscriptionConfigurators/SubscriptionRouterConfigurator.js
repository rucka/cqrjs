"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.SubscriptionConfigurators.SubscriptionRouterConfigurator = (function () {

        var configuratorsField = System.ComponentModel.PrivateName();
        var networkField = System.ComponentModel.PrivateName();

        function SubscriptionRouterConfigurator(network) {
            this.setNetwork(network);
            this[configuratorsField] = [];

            Object.defineProperty(this, 'serviceType', {
                enumerable: true,
                writable: false,
                value : 'SubscriptionRouterService'
            });

            Object.defineProperty(this, 'layer', {
                enumerable: true,
                writable: false,
                value : ServiceBus.BusServiceLayer.Session
            });
        }

        SubscriptionRouterConfigurator.prototype.validate = function () {
            var validationResults = [];
            _(this[configuratorsField]).each(function (c) {
                validationResults.concat(c.validate());
            });
            return validationResults;
        };

        SubscriptionRouterConfigurator.prototype.configure = function (busBuilder) {
            ServiceBus.Builders.ServiceBusBuilder.ensureIsServiceBusBuilder(busBuilder);
            busBuilder.addBusServiceConfigurator(this);
            return busBuilder;
        };

        SubscriptionRouterConfigurator.prototype.create = function (bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);

           //SubscriptionRouterBuilder builder = new SubscriptionRouterBuilderImpl(bus, _network);
           //builder = _configurators.Aggregate(builder, (seed, next) => next.Configure(seed));
           //return builder.Build();
            var router = new ServiceBus.Subscriptions.Coordinator.SubscriptionRouterService(bus, this[networkField]);
            var connector = new ServiceBus.Subscriptions.Coordinator.BusSubscriptionConnector(bus);
            router.addObserver(connector);
            return router;
        };

        SubscriptionRouterConfigurator.prototype.setNetwork = function (network) {
            if (!network && !_(network).isString()) {
                throw new Error('required network string as parameter')
            }
            this[networkField] = network;
        };

        SubscriptionRouterConfigurator.prototype.addConfigurator = function (configurator) {
            System.ComponentModel.Object.prototype.ensureHasMethods(configurator, 'configurator', ['validate', 'configure']);
            this[configuratorsField].push(configurator);
        };

        return SubscriptionRouterConfigurator;
    }());
});