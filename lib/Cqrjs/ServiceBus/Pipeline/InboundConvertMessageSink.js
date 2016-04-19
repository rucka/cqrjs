"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Sinks");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.Sinks.InboundConvertMessageSink = (function () {
        var outputField = System.ComponentModel.PrivateName();
        var messageTypeField = System.ComponentModel.PrivateName();

        function InboundConvertMessageSink(output, messageType) {
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(output);

            if (!messageType || !_(messageType).isString()) {
                throw new Error ('messageType not set');
            }

            this[outputField] = output;
            this[messageTypeField] = messageType;
        }

        InboundConvertMessageSink.prototype.enumerate = function(context) {
            var messageType = this[messageTypeField];
            var result = context.tryGetContext(messageType);
            if (!result.hasContext) {
                return [];
            }
            var outputContext = result.context;

            var items = this[outputField].enumerate(outputContext);
            var results = _(items).map(function (consumer) {
                var c = function (x) {
                    try {
                        return consumer(outputContext);
                    } catch (e) {
                        outputContext.generateFault(e);
                        throw e;
                    }
                };
                c.messageType = outputContext.messageType;
                c.consumerType = consumer.consumerType;
                return c;
            });
            return results;
        };

        InboundConvertMessageSink.prototype.inspect = function(inspector) {
            var output = this[outputField];
            return inspector.inspect(this) && output.inspect(inspector);
        };

        InboundConvertMessageSink.prototype.geMessageType = function() {
            return this[messageTypeField];
        };

        return InboundConvertMessageSink;
    }());
});