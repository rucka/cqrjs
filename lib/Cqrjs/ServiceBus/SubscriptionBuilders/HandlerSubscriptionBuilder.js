"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionBuilders");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.SubscriptionBuilders.HandlerSubscriptionBuilder = (function () {
        var messagenameField = System.ComponentModel.PrivateName();
        var handlerField = System.ComponentModel.PrivateName();
        var referenceFactoryField = System.ComponentModel.PrivateName();
        function HandlerSubscriptionBuilder(messagename, handler, referenceFactory) {
            if (!_(messagename).isString()) {
                throw new Error('Expected messagename as string');
            }

            if (!_(handler).isFunction()) {
                throw new Error('Expected handler as function');
            }

            if (!_(referenceFactory).isFunction()) {
                throw new Error('Expected referenceFactory as function');
            }

            this[messagenameField] = messagename;
            this[handlerField] = handler;
            this[referenceFactoryField] = referenceFactory;
        }

        HandlerSubscriptionBuilder.prototype.subscribe = function (configurator) {
            var handler = this[handlerField];
            var referenceFactory = this[referenceFactoryField];
            var unsubscribe = connect(configurator, handler);
            return referenceFactory(unsubscribe);
        };

        function connect(configurator, handler) {
            var messageType = handler.getMessageType();

            var router = findOrCreate(configurator, messageType);
            var sink = new ServiceBus.Pipeline.Sinks.InstanceMessageSink(forHandler(handler));

            var result = router.connect(sink);
            var remove = configurator.subscribedTo(messageType);

            return function() {
                return result() && (router.sinkCount == 0) && remove();
            };
        }

        function findOrCreate(configurator, messageType) {
            var sink = configurator.pipeline;
            var scope = new InboundMessageRouterConfiguratorScope(messageType);
            sink.inspect(scope);
            if (!_(scope.outputRouter).isUndefined()) {return scope.outputRouter;}
            return configureRouter(scope.inputRouter, messageType);
        }

        function configureRouter(inputRouter, messageType) {
            if (!inputRouter) {
                var error = new Error('The input was not found');
                error.getType = 'PipelineError';
                throw error;
            }

            var router = new ServiceBus.Pipeline.Sinks.MessageRouter();
            router.setContextType('ConsumeContext', messageType);

            var translator = new ServiceBus.Pipeline.Sinks.InboundConvertMessageSink(router, messageType);
            inputRouter.connect(translator);
            return router;
        }

        function forHandler (selector) {
            return function (context) {
                var handler = selector(context);
                if (!handler) {
                    return [];
                }
                return [handler];
            };
        }

        var InboundMessageRouterConfiguratorScope = (function () {
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

                if (type === 'Consume[' + this.messageType + ']') {
                    this.outputRouter = router;
                    return false;
                }

                if (type === 'ConsumeContext') {
                    this.inputRouter = router;
                }

                return true;
            }

            return ctor;
        }());


        return HandlerSubscriptionBuilder;
    }());
});