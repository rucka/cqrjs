"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Sinks");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.Sinks.InstanceMessageSink = (function () {
        var selectorField = System.ComponentModel.PrivateName();

        var InstanceMessageSink = function (selector) {
            if (_(selector).isUndefined() || !_(selector).isFunction()) {
                throw new Error('selector must be provided as function');
            }
            this[selectorField] = selector;
        }

        InstanceMessageSink.prototype.inspect = function (inspector) {
            return inspector.inspect(this);
            return true;
        };

        InstanceMessageSink.prototype.enumerate = function (context) {
            ServiceBus.Context.ConsumeContext.ensureIsConsumeContext(context);
            var selector = this[selectorField];
            var results = [];
            _(selector(context)).each( function (result) {
               context.baseContext.notifyConsume(context, 'function<' + context.messageType + '>', undefined);
                results.push(result);
            });
            return results;
        };

        return InstanceMessageSink;
    }());
});