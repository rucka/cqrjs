"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.OutboundMessagePipeline = (function () {

        var outputField = System.ComponentModel.PrivateName();
        function OutboundMessagePipeline(output) {
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(output);
            this[outputField] = output;
        }

        OutboundMessagePipeline.prototype.inspect = function(inspector) {
            var output = this[outputField];
            return inspector.inspect(this, function () {
                return output.inspect(inspector);
            });
        };

        OutboundMessagePipeline.prototype.enumerate = function(context) {
            var output = this[outputField];
            var results = output.enumerate(context);
            //var enumeration = _(output.enumerate(context)).
            //    map(function(s){
            //        return s.enumerate(context);
            //    });
            //var results = _(enumeration).
            //    flatten();
            return results;
        };

        OutboundMessagePipeline.ensureIsOutboundMessagePipeline = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'OutboundMessagePipeline', ['enumerate', 'inspect']);
        };

        return OutboundMessagePipeline;
    }());

    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Configuration");
    ServiceBus.Pipeline.Configuration.OutboundMessagePipelineConfigurator = (function () {

        function OutboundMessagePipelineConfigurator(bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            var router = new ServiceBus.Pipeline.Sinks.MessageRouter();
            router.setContextType('SendContext');
            var pipeline = new ServiceBus.Pipeline.OutboundMessagePipeline(router);
            Object.defineProperty(this, 'bus', {
                enumerable: true,
                writable: false,
                value: bus
            });

            Object.defineProperty(this, 'pipeline', {
                enumerable: true,
                writable: false,
                value: pipeline
            });
        }

        return OutboundMessagePipelineConfigurator;
    }());

});