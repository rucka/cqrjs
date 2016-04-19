"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.InboundMessagePipeline = (function () {
        var outputField = System.ComponentModel.PrivateName();
        var configuratorField = System.ComponentModel.PrivateName();

        function InboundMessagePipeline(output, configurator) {
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(output);
            //TODO check configurator
            this[outputField] = output;
            this[configuratorField] = configurator;
        }

        InboundMessagePipeline.prototype.configure = function(configureCallback) {
            if (!_(configureCallback).isFunction()) {
                throw new Error ('configureCallback is not a function');
            }
            return configureCallback(this[configuratorField]);
        };

        InboundMessagePipeline.prototype.enumerate = function(context) {
            return this[outputField].enumerate(context);
        };

        InboundMessagePipeline.prototype.inspect = function(inspector) {
            var output = this[outputField];
            return inspector.inspect(this, function () {
                return output.inspect(inspector);
            });
        };

        InboundMessagePipeline.ensureIsInboundMessagePipeline = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'InboundMessagePipeline', ['configure', 'inspect']);
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(instance);
        };

        return InboundMessagePipeline;
    }());

    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Configuration");
    ServiceBus.Pipeline.Configuration.InboundMessagePipelineConfigurator = (function () {
        var busField = System.ComponentModel.PrivateName();
        var subscriptionEventHandlersField = System.ComponentModel.PrivateName();
        var pipelineField = System.ComponentModel.PrivateName();

        function InboundMessagePipelineConfigurator(bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            this[busField] = bus;
            var router = new ServiceBus.Pipeline.Sinks.MessageRouter();
            router.setContextType('ConsumeContext');
            this[pipelineField] = new ServiceBus.Pipeline.InboundMessagePipeline(router, this);

            this[subscriptionEventHandlersField] = new RegisterList();

            Object.defineProperty(this, 'pipeline', {
                enumerable:true,
                writable:false,
                value: this[pipelineField]
            });

            Object.defineProperty(this, 'bus', {
                enumerable:true,
                writable:false,
                value: this[busField]
            });
        }

        InboundMessagePipelineConfigurator.prototype.register = function(subscriptionEventHandler) {
            return this[subscriptionEventHandlersField].register(subscriptionEventHandler);
        };

        InboundMessagePipelineConfigurator.prototype.subscribedTo = function(messagetype, correlationId) {
            if (!_(correlationId).isUndefined()) {
                throw new Error('subscribeTo using correlationId is not supported.');
            }

            var results = [function() {return true;}]

            var result = function () {
                return _.reduce(results, function(isTrue, res){ return isTrue && res; }, true);
            };

            var subscriptionEventHandlers = this[subscriptionEventHandlersField];
            subscriptionEventHandlers.each(function (x) {
                results.push(x.subscribedTo(messagetype));
            });

            return result;
        };

        InboundMessagePipelineConfigurator.createDefault = function (bus) {
            return new InboundMessagePipelineConfigurator(bus)[pipelineField];
        };

        var RegisterList = (function(){
            var ctor = function (){
                this.items = [];
            };

            ctor.prototype.register = function (subscriptionEvent) {
                var that = this;
                System.ComponentModel.Object.prototype.ensureHasMethods(subscriptionEvent, 'subscriptionEvent', 'subscribedTo');
                this.items.splice(0,0, subscriptionEvent);
                return function () {
                    var count = that.items.length;
                    removeA(subscriptionEvent);
                    return count === that.items.length;
                };
            };

            ctor.prototype.each = function (action) {
                _(this.items).each(function (item) {
                    action(item);
                });
            };

            function removeA(arr) {
                var what, a = arguments, L = a.length, ax;
                while (L > 1 && arr.length) {
                    what = a[--L];
                    while ((ax= arr.indexOf(what)) !== -1) {
                        arr.splice(ax, 1);
                    }
                }
                return arr;
            }

            return ctor;
        }());

        return InboundMessagePipelineConfigurator;
    }());



});