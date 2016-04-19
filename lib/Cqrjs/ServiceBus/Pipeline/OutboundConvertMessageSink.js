"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Sinks");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.Sinks.OutboundConvertMessageSink = (function () {
        var outputField = System.ComponentModel.PrivateName();
        var messageTypeField = System.ComponentModel.PrivateName();

        function OutboundConvertMessageSink(output, messageType) {
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(output);

            if (!messageType || !_(messageType).isString()) {
                throw new Error ('messageType not set');
            }

            this[outputField] = output;
            this[messageTypeField] = messageType;
        }

        OutboundConvertMessageSink.prototype.enumerate = function(context) {
            var messageType = this[messageTypeField];
            var output = this[outputField];
            var tryGetContext = context.tryGetContext(messageType);
            if (!tryGetContext.hasContext) {
                return [];
            }
            var outputContext = tryGetContext.context;
            var consumers = output.enumerate(outputContext);
            var handlers = _(consumers).map(function(consumer) {
                return function (x) {
                    return consumer(outputContext);
                }
            });
            return handlers;
        };

        OutboundConvertMessageSink.prototype.inspect = function(inspector) {
            var output = this[outputField];
            return inspector.inspect(this) && output.inspect(inspector);
        };

        OutboundConvertMessageSink.prototype.getMessageType = function() {
            return this[messageTypeField];
        };

        return OutboundConvertMessageSink;
    }());
});