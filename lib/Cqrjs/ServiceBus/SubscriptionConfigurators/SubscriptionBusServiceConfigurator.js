"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.SubscriptionConfigurators.SubscriptionBusServiceConfigurator = (function () {

       var configuratorsField = System.ComponentModel.PrivateName();

        function SubscriptionBusServiceConfigurator() {
            this[configuratorsField] = [];

            Object.defineProperty(this, 'serviceType', {
                enumerable: true,
                writable: false,
                value : 'SubscriptionBusService'
            });

            Object.defineProperty(this, 'layer', {
                enumerable: true,
                writable: false,
                value : ServiceBus.BusServiceLayer.Application
            });

        }

        SubscriptionBusServiceConfigurator.prototype.addConfigurator = function (configurator) {
            System.ComponentModel.Object.prototype.ensureHasMethods(configurator, 'configurator', 'configure');
            this[configuratorsField].push(configurator);
        };


        SubscriptionBusServiceConfigurator.prototype.configure = function (busBuilder) {
            ServiceBus.Builders.ServiceBusBuilder.ensureIsServiceBusBuilder(busBuilder);
            busBuilder.addBusServiceConfigurator(this);
            return busBuilder;
        };

        SubscriptionBusServiceConfigurator.prototype.create = function (bus) {
            var configurators = this[configuratorsField];
            var subscriptionServiceBuilder = new ServiceBus.SubscriptionBuilders.SubscriptionBusServiceBuilder();
            _(configurators).each(function (configurator) {
               configurator.configure(subscriptionServiceBuilder);
            });
            return subscriptionServiceBuilder.build();
        };

        SubscriptionBusServiceConfigurator.prototype.handler = function (messagename, handler) {
            var handlerConfigurator = new ServiceBus.SubscriptionConfigurators.HandlerSubscriptionConfigurator(messagename, handler);
            var busServiceConfigurator = new ServiceBus.SubscriptionConfigurators.SubscriptionBusServiceBuilderConfigurator(handlerConfigurator);
            this.addConfigurator(busServiceConfigurator);
            return handlerConfigurator;
        };

        SubscriptionBusServiceConfigurator.prototype.validate = function () {
            var validationResults = [];

            _(this[configuratorsField]).each(function (c) {
                _(c.validate()).each(function (e) {
                    e.key = 'subscribe.' + e.key;
                    validationResults.push(e);
                });
            });

            return validationResults;
        };


        return SubscriptionBusServiceConfigurator;
    }());
});