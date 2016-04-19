"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.SubscriptionConfigurators.SubscriptionBusServiceBuilderConfigurator = (function () {

       var configuratorField = System.ComponentModel.PrivateName();

        function SubscriptionBusServiceBuilderConfigurator(configurator) {
            System.ComponentModel.Object.prototype.ensureHasMethods(configurator, 'configurator', ['configure', 'validate']);
            this[configuratorField] = configurator;
        }

        SubscriptionBusServiceBuilderConfigurator.prototype.validate = function () {return this[configuratorField].validate();};

        SubscriptionBusServiceBuilderConfigurator.prototype.configure = function (builder) {
            System.ComponentModel.Object.prototype.ensureHasMethods(builder, 'builder', 'addSubscriptionBuilder');
            var configurator = this[configuratorField];
            var subscriptionBuilder = configurator.configure();
            builder.addSubscriptionBuilder(subscriptionBuilder);
            return builder;
        };

        return SubscriptionBusServiceBuilderConfigurator;
    }());
});