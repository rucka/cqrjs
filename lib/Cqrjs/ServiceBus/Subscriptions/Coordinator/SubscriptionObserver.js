"use strict";
define(['../../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Subscriptions.Coordinator");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Subscriptions.Coordinator.SubscriptionObserver = (function () {
        return {
            ensureIsSubscriptionObserver : function (instance) {
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'SubscriptionObserver', ['onSubscriptionAdded', 'onSubscriptionRemoved', 'onComplete']);
            }
        };
    }());
});