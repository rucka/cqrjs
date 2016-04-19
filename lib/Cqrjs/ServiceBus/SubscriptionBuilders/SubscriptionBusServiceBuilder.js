"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionBuilders");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.SubscriptionBuilders.SubscriptionBusServiceBuilder = (function () {
        var buildersField = System.ComponentModel.PrivateName();

        function SubscriptionBusServiceBuilder() {
            this[buildersField] = [];
        }

        SubscriptionBusServiceBuilder.prototype.addSubscriptionBuilder = function (builder) {
            ServiceBus.SubscriptionBuilders.SubscriptionBuilder.ensureIsSubscriptionBuilder(builder);
            this[buildersField].push(builder);
        };

        SubscriptionBusServiceBuilder.prototype.build = function () {
            return new ServiceBus.Subscriptions.SubscriptionBusService(this[buildersField]);
        };

        return SubscriptionBusServiceBuilder;
    }());
});