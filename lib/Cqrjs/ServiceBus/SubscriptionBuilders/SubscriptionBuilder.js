"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionBuilders");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.SubscriptionBuilders.SubscriptionBuilder = (function () {
        return{
            ensureIsSubscriptionBuilder : function (instance) {
                System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'SubscriptionBuilder', ['subscribe']);
            }
        };
    }());
});