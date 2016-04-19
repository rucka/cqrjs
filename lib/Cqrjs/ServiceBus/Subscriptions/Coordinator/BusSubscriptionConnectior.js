"use strict";
define(['../../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Subscriptions.Coordinator");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Subscriptions.Coordinator.BusSubscriptionConnector = (function () {
        var serviceName = 'BusSubscriptionConnector';

        var busField = System.ComponentModel.PrivateName();
        var connectionCacheField = System.ComponentModel.PrivateName();
        var dataBusSubscriptionCacheField = System.ComponentModel.PrivateName();
        var controlBusSubscriptionCacheField = System.ComponentModel.PrivateName();

        function BusSubscriptionConnector(bus) {
            var that = this;
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            this[busField] = bus;
            this[connectionCacheField] = {};
            this[dataBusSubscriptionCacheField] = new SubscriptionCache(bus);
            this[controlBusSubscriptionCacheField] = new SubscriptionCache(bus.controlBus);
        }

        BusSubscriptionConnector.prototype.onSubscriptionAdded = function(message) {
            System.ComponentModel.Object.prototype.ensureHasProperties(message, 'Subscription', ['subscriptionId', 'messageName', 'endpointUri'/*, 'correlationId'*/])
            var isControlMessage = endsWith(message.endpointUri.url.pathname, '_control');

            if (!isControlMessage) {
                this[connectionCacheField][message.subscriptionId] = this[dataBusSubscriptionCacheField].connect(message.messageName, message.endpointUri, message.correlationId);
            } else {
                this[connectionCacheField][message.subscriptionId] = this[controlBusSubscriptionCacheField].connect(message.messageName, message.endpointUri, message.correlationId);
            }
            logdebug("Added: {0} => {1}, {2}".
                replace("{0}", message.messageName).
                replace("{1}", message.endpointUri.toString()).
                replace("{2}", message.subscriptionId));
        };

        BusSubscriptionConnector.prototype.onSubscriptionRemoved = function(message) {
            var unsubscribe = this[connectionCacheField][message.subscriptionId];
            unsubscribe();
            this[connectionCacheField][message.subscriptionId] = undefined;

            logdebug("Removed: {0} => {1}, {2}".
                replace("{0}", message.messageName).
                replace("{1}", message.endpointUri.toString()).
                replace("{2}", message.subscriptionId));
        };

        BusSubscriptionConnector.prototype.onComplete = function() {
        };

        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }

        var SubscriptionCache = (function (){
            var ctor = function (bus) {
                this.bus = bus;
            };

            ctor.prototype.connect = function (messageName, endpointUri, correlationId){
                if (!_(correlationId).isUndefined()) {throw new Error('connect with correlation key not supported');}
                var bus = this.bus;
                var endpoint = bus.getEndpoint(endpointUri);
                var pipeline = bus.outboundPipeline;

                var router = findOrCreate(pipeline, messageName);
                var sink = new ServiceBus.Pipeline.Sinks.EndpointMessageSink(messageName, endpoint);

                var result = router.connect(sink);

                return function() {
                    return result() && (router.sinkCount == 0);
                };
            };

            function findOrCreate (sink, messageType) {
                var scope = new OutboundMessageRouterConfiguratorScope(messageType);
                sink.inspect(scope);

                if (!_(scope.outputRouter).isUndefined()) {return scope.outputRouter;}
                return configureRouter(scope.inputRouter, messageType);
            }

            function configureRouter (inputRouter, messageType) {
                if (!inputRouter) {
                    var error = new Error('The input router was not found');
                    error.getType = 'PipelineError';
                    throw error;
                }

                var router = new ServiceBus.Pipeline.Sinks.MessageRouter();
                router.setContextType('BusPublishContext', messageType);

                var translator = new ServiceBus.Pipeline.Sinks.OutboundConvertMessageSink(router, messageType);
                inputRouter.connect(translator);
                return router;
            }

            return ctor;
        }());

        var OutboundMessageRouterConfiguratorScope = (function () {
            var ctor = function (toutput) {
                this.toutput = toutput;
            };

            ctor.prototype.inspect = function (sink, inspectChildSink) {
                if (ServiceBus.Pipeline.Sinks.MessageRouter.isMessageRouter(sink)) {
                    if (!inspectMessageRouter.call(this, sink)){
                        return false;
                    }
                }

                return _(inspectChildSink).isUndefined() || inspectChildSink();
            };


            function inspectMessageRouter(router) {
                var type = router.getContextType();

                if (type === 'BusPublishContext[' + this.messageType + ']') {
                    this.outputRouter = router;
                    return false;
                }

                if (type === 'SendContext') {
                    this.inputRouter = router;
                }

                return true;
            }

            return ctor;
        }());


        function log (message, level, category, metadata) {
            System.ComponentModel.logger.log(message, level, serviceName, category, metadata);
        }

        function logdebug (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'debug', serviceName, category, metadata);
        }

        function logverbose (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'verbose', serviceName, category, metadata);
        }

        function logwarn (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'warn', serviceName, category, metadata);
        }

        function logerror (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'err', serviceName, category, metadata);
        }

        return BusSubscriptionConnector;
    }());
});