"use strict";
define(['../../../root', 'mdcore', 'underscore', 'Q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Context");
    var ServiceBus = Cqrjs.ServiceBus;

    /// <summary>
    /// The context keeps track of some statistics about the consumption
    /// of the message. Both when the receive operation completes
    /// and when the consume operation completes, does this context
    /// broadcast that information on the passed <see cref="UntypedChannel"/>
    /// passed in the constructor.
    /// </summary>
    ServiceBus.Context.ServiceBusReceiveContext = (function () {
        var serviceName = 'ServiceBusReceiveContext';

        var busField = System.ComponentModel.PrivateName();
        var eventChannelField = System.ComponentModel.PrivateName();
        var receiveTimeoutField = System.ComponentModel.PrivateName();
        var startTimeField = System.ComponentModel.PrivateName();
        var receiveTimeField = System.ComponentModel.PrivateName();
        var consumeTimeField = System.ComponentModel.PrivateName();
        var consumersField = System.ComponentModel.PrivateName();
        var consumeCountField = System.ComponentModel.PrivateName();
        var receiveNotifyField = System.ComponentModel.PrivateName();
        var consumeNotifyField = System.ComponentModel.PrivateName();

        var ServiceBusReceiveContext = function (bus, eventChannel, receiveTimeout) {
            this[busField] = bus;
            this[eventChannelField] = eventChannel;
            this[receiveTimeoutField] = receiveTimeout;
            this[receiveNotifyField] = false;
            this[consumeNotifyField] = false;
            this[consumeCountField] = 0;
        };

        /// <summary>
        /// <para>Performs a receive from the endpoint that is specified on the bus given in the
        /// constructor. First try to do the receive, then let the endpoint/transport
        /// call <see cref="DeliverMessageToConsumers"/> (if there are consumers interested)</para>
        /// <para>This method must not throw exceptions, because it might not be run on the main thread.</para>
        /// </summary>
        ServiceBusReceiveContext.prototype.receiveFromEndpoint = function () {
            var that = this;

            var bus = this[busField];

            Q.fcall(function (){
                that[startTimeField] = new Date();
                that[receiveTimeField] = process.hrtime();

                var timeout = that[receiveTimeoutField];

                // Let the endpoint (and hence inbound transport) consume a message.
                // This lambda passed is not called until the transport decides that it has
                // gotten a message and want to pass it forward.

                if (bus.disposed) {
                    _(notifyReceiveCompleted).bind(that)();
                    _(notifyConsumeCompleted).bind(that)();
                    return;
                }

                var promise = bus.endpoint.receive(function (context) {
                    context.setBus(bus);

                    // look inside the inbound pipeline and find all message sinks that match the receive
                    // context (i.e. the message type we actually got from the transport)
                    // Have a look at everything is PipelineSink ConsumeContext to
                    // dig deeper
                    that[consumersField] = bus.inboundPipeline.enumerate(context);
                    if (_(that[consumersField]).isUndefined() || that[consumersField].length === 0) {return;}

                    return  _(deliverMessageToConsumers).bind(that)/*.then(defer.resolve).fail(defer.reject)*/;
                }, timeout);

                return promise;
            }).fail(function (e) {
                logerror('Consumer Error Exposed. Error message: ' + e.message);
            }).
            fin(function () {
                _(notifyReceiveCompleted).bind(that)();
                _(notifyConsumeCompleted).bind(that)();
            });
        };

        /// <summary>
        /// <para>Deliver the message to the consumers selected in <see cref="ReceiveFromEndpoint"/>. Assumption:
        /// the inbound transport will send the same context to this method as it did
        /// to the lambda in <see cref="ReceiveFromEndpoint"/>.</para>
        /// <para>This method will try to give the message to all consumers found.</para>
        /// </summary>
        /// <param name="context">The receive context</param>
        /// <exception cref="MessageException">If at least one consumer throws
        /// an exception, then a MessageException will be thrown. If multiple consumers
        /// threw exceptions, then the last exception will be the inner exception
        /// and the others won't be tracked.</exception>
        var deliverMessageToConsumers = function (context) {
            var that = this;

            return Q.fcall(function () {
                var consumers = that[consumersField];
                _(notifyReceiveCompleted).bind(that)();

                that[receiveTimeField] = process.hrtime(that[receiveTimeField]);
                that[consumeTimeField] = process.hrtime();

                logdebug('Dispatching message on {0} from thread {1}'.
                    replace("{0}", that[busField].endpoint.address.uri).
                    replace("{1}", process.pid));

                var atLeastOneConsumerFailed = false;
                var lastException = null;

                var promises = _(consumers).
                    map(function (consumer) {
                        return Q.fcall(function () {
                            return consumer(context);
                        }).then(function () {
                                that[consumeCountField]++;
                            }).fail(function (e) {
                                var consumerType = consumer.consumerType ? consumer.consumerType : '[N/A]';
                                var messageType = consumer.messageType ? consumer.messageType : '[N/A]';

                                logerror("'{0}' threw an error consuming message '{1}'".
                                    replace('{0}', consumerType).
                                    replace('{1}', messageType));

                                atLeastOneConsumerFailed = true;
                                lastException = e;
                            });
                    });

                return Q.allResolved(promises).then (function () {
                    if (atLeastOneConsumerFailed) {
                        var error = new Error("At least one consumer threw an exception");
                        error.getErrorType = function () {return 'MessageError';};
                        error.getContextType = function () { return context.getContextType();};
                        error.innerError = lastException;
                        throw error;
                    }
                });
            }).fin (function () {
                that[consumeTimeField] = process.hrtime(that[consumeTimeField]);
                that[consumersField] = undefined;

                _(reportConsumerTime).bind(that)(that[startTimeField], that[receiveTimeField], that[consumeTimeField], context);
                _(reportConsumerCount).bind(that)(context, that[consumeCountField]);

                _(notifyConsumeCompleted).bind(that)();
            });
        };

        var reportConsumerTime = function (startTime, receiveDuration, consumeDuration, context) {
            var message = {
                getMessageType : function () {return 'MessageReceived';},
                context : context,
                receivedAt : startTime,
                receiveDuration : receiveDuration,
                consumeDuration : consumeDuration
            };

            this[eventChannelField].send(message);
        };

        var reportConsumerCount = function (context, count) {
            var message = {
                getMessageType : function () {return 'MessageConsumed';},
                context : context,
                consumeCount : count
            };

            this[eventChannelField].send(message);
        };

        var notifyReceiveCompleted = function  () {
            if (this[receiveNotifyField] === true) {return;}
            this[eventChannelField].send({getMessageType:function(){return 'ReceiveCompleted';}});
            this[receiveNotifyField]++;
        };

        var notifyConsumeCompleted = function () {
            if (this[consumeNotifyField] === true) {return;}
            this[eventChannelField].send({getMessageType:function(){return 'ConsumeCompleted';}});
            this[consumeNotifyField]++;
        };

        function isPromise(p) {
            return _(p.promiseSend).isFunction() && _(p.valueOf).isFunction();
        }

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

        return ServiceBusReceiveContext;
    }());
});