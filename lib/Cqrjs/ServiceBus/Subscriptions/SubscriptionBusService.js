"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Subscriptions");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Subscriptions.SubscriptionBusService = (function () {
        var buildersField = System.ComponentModel.PrivateName();
        var subscriptionsField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function SubscriptionBusService(builders) {
            this[buildersField] = builders;
            this[subscriptionsField] = [];
            this[disposedField] = false;
        }

        SubscriptionBusService.prototype.start = function (bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            var builders = this[buildersField];
            var subscriptions = this[subscriptionsField];

            bus.configure(function (pipelineConfigurator) {
                _(builders).each (function (builder) {
                    try {
                        var subscription = builder.subscribe(pipelineConfigurator);
                        subscriptions.push(subscription);
                    } catch (e) {
                        stopAllSubscriptions(subscriptions);
                        throw e;
                    }
                });
                return function () {return true;};
            });
        };


        SubscriptionBusService.prototype.stop = function () {
            stopAllSubscriptions(this[subscriptionsField]);
        };

        function stopAllSubscriptions(subscriptions) {
            _(subscriptions).each(function (s) {
                s.onStop();
            });
            subscriptions.length = 0;
        }

        SubscriptionBusService.prototype.getType = function () {return 'SubscriptionBusService';};

        SubscriptionBusService.prototype.dispose = function () {
            if (this[disposedField]) {
                return;
            }

            this[buildersField] = [];
            this[subscriptionsField] = [];

            this[disposedField] = true;
        };

        return SubscriptionBusService;
    }());
});