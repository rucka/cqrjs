"use strict";
define(['../../../root', 'mdcore', 'underscore', 'Q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.Endpoint = (function () {
        var serviceName = 'Endpoint';

        var trackerField = System.ComponentModel.PrivateName();
        var transportField = System.ComponentModel.PrivateName();
        var errorTransportField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function Endpoint(address, serializer, transport, errorTransport, messageTracker) {
            ServiceBus.EndpointAddress.ensureIsEndpointAddress(address);
            ServiceBus.Transports.DuplexTransport.ensureIsDuplexTransport(transport);
            ServiceBus.Transports.OutboundTransport.ensureIsOutboundTransport(errorTransport);
            ServiceBus.Transports.InboundMessageTracker.ensureIsInboundMessageTracker(messageTracker);

            var that = this;
            this[transportField] = transport;

            Object.defineProperty(this, 'address', {
                enumerable:true,
                get: function() {return address;}
            });
            Object.defineProperty(this, 'serializer', {
                enumerable:true,
                get: function() {return serializer;}
            });

            Object.defineProperty(this, 'inboundTransport', {
                enumerable:true,
                get: function() {return that[transportField].inboundTransport;}
            });

            Object.defineProperty(this, 'outboundTransport', {
                enumerable:true,
               get: function() {return that[transportField].outboundTransport;}
            });

            this[errorTransportField] = errorTransport;
            Object.defineProperty(this, 'errorTransport', {
                enumerable:true,
                get: function() {return that[errorTransportField];}
            });
            this[trackerField] = messageTracker;
        }

        Endpoint.prototype.send = function (context) {
            var that = this;
            return Q.fcall(function () {
                var transport = that[transportField];

                context.setDestinationAddress(that.address.uri);
                context.setBodyWriter(function(stream) {
                    that.serializer.serialize(stream, context);
                });

                return Q.fcall(function () {
                    return transport.send(context);
                });
            }).then(function () {
                    context.notifySend(that.address);
            }).fail(function (e) {
                var error = new Error('An exception was thrown during Send');
                error.innerError = e;
                error.errorType = 'SendError';
                error.messageType = context.messageType;
                throw error;
            });

            /*
             var that = this;
             try {
                var transport = this[transportField];

                context.setDestinationAddress(this.address.uri);
                context.setBodyWriter(function(stream) {
                    that.serializer.serialize(stream, context);
                });

                transport.send(context);
                context.notifySend(this.address);

            } catch(e) {
                var error = new Error('An exception was thrown during Send');
                error.innerError = e;
                error.errorType = 'SendError';
                error.messageType = context.messageType;
                throw error;
            }*/
        };

        Endpoint.prototype.receive = function (receiver, timeout) {
            if (this[disposedField] === true) {throw new Error('The endpoint has already been disposed: ' + this.address.uri.toString());}
            if (_(timeout).isNaN()) {throw new Error('timeout not provided');};
            if (!_(receiver).isFunction()) {throw new Error('receiver not provided as function');};

            var that = this;

            var successfulMessageId = null;
            var tracker = this[trackerField];
            var transport = this[transportField];
            var serializer = this.serializer;

            var defer = Q.defer();

            try {
                var failedMessageException = null;

                return transport.receive(function (acceptContext) {
                    if (_(acceptContext).isUndefined()) {
                        defer.resolve();
                        return;
                    }

                    failedMessageException = null;

                    if (!_(successfulMessageId).isUndefined() && !_(successfulMessageId).isNull()) {
                        logdebug("Received Successfully: " + successfulMessageId);

                        tracker.messageWasReceivedSuccessfully(successfulMessageId);
                        successfulMessageId = null;
                    }

                    var acceptMessageId = acceptContext.originalMessageId ? acceptContext.originalMessageId : acceptContext.messageId;
                    var result = tracker.isRetryLimitExceeded(acceptMessageId);
                    if (result.exceeded) {
                        logerror("Message retry limit exceeded {0}:{1}".
                            replace("{0}", that.address.toString()).
                            replace("{1}", acceptMessageId));

                        failedMessageException = result.retryException;
                        return moveMessageToErrorTransport;
                    }

                    if (acceptContext.messageId !== acceptMessageId) {
                        logerror("Message {0} original message id {1}".
                            replace("{0}", acceptContext.messageId).
                            replace("{1}", acceptContext.OriginalMessageId));
                    }

                    var receive;

                    try {
                        acceptContext.setEndpoint(that);
                        serializer.deserialize(acceptContext);
                        receive = receiver(acceptContext);
                        if (_(receive).isUndefined()) {
                            that.address.logSkipped(acceptMessageId);
                            tracker.incrementRetryCount(acceptMessageId);
                            return;
                        }
                    } catch (e) {
                        if (e.errorType === 'SerializationError') {
                            logerror("Unrecognized message " + that.address.uri.toString() + ":" + acceptMessageId +'. Message: ' + e.message);
                            tracker.incrementRetryCount(acceptMessageId, e);
                            return _(moveMessageToErrorTransport).bind(that);
                        }
                        logerror("An exception was thrown preparing the message consumers. Message: " + e.message);
                        if (tracker.incrementRetryCount(acceptMessageId, e)) {
                            acceptContext.publishPendingFaults();
                        }
                        return;
                    }

                    return function(context) {
                        var receiveMessageId = _(context.originalMessageId).isUndefined() ? context.messageId : context.originalMessageId;

                        receive(context).
                            then(function () {
                                successfulMessageId = receiveMessageId;
                                defer.resolve();
                            }).
                            fail (function (e) {
                                logerror('An error was thrown by a message consumer: ' + e.message);
                                if (tracker.incrementRetryCount(receiveMessageId, e)){
                                    context.publishPendingFaults();
                                }
                                if (!context.isTransactional) {
                                    _(saveMessageToInboundTransport).bind(that)(context);
                                }
                                defer.reject(e);
                            });

                        /*
                        try {
                            receive(context);
                            successfulMessageId = receiveMessageId;
                        } catch(e) {
                            logerror('An error was thrown by a message consumer: ' + e.message);
                            if (tracker.incrementRetryCount(receiveMessageId, e)){
                                context.publishPendingFaults();
                            }
                            if (!context.isTransactional) {
                                _(saveMessageToInboundTransport).bind(that)(context);
                            }
                            defer.reject(e);
                        }*/
                    };
                }, timeout);

                if (failedMessageException) {
                    var errorType = failedMessageException.getErrorType ? failedMessageException.getErrorType() : 'unknown error';
                    logerror("Throwing Original error: {0}" + errorType);
                    throw failedMessageException;
                }
            } catch (e) {
                if (successfulMessageId != null) {
                    logdebug("Increment Retry Count: " + successfulMessageId);

                    tracker.incrementRetryCount(successfulMessageId, e);
                    successfulMessageId = null;
                }
                defer.reject(e);
            } finally {
                if (successfulMessageId) {
                    logdebug("Received Successfully: " + successfulMessageId);

                    that[trackerField].messageWasReceivedSuccessfully(successfulMessageId);
                    successfulMessageId = undefined;
                }
            }
            return defer.promise;
        };

        var saveMessageToInboundTransport = function (context) {
            var moveContext = new ServiceBus.Context.MoveMessageSendContext(context);

            this[transportField].send(moveContext);
            this.address.logReQueued(this[transportField].address, context.messageId, "");
        };

        var moveMessageToErrorTransport = function (context) {
            var moveContext = new ServiceBus.Context.MoveMessageSendContext(context);
            this.errorTransport.send(moveContext);
            var messageId = _(context.originalMessageId).isUndefined() ? context.messageId : context.originalMessageId;
            this[trackerField].messageWasMovedToErrorQueue(messageId);
            this.address.logMoved(this.errorTransport.address, context.messageId, "");
        };

        Endpoint.prototype.dispose = function () {
            if (!_(this.errorTransport).isUndefined()) {
                this.errorTransport.dispose();
                this[errorTransportField] = undefined;
            }

            if (!_(this.transport).isUndefined()) {
                _(this.transport).dispose();
                this[transportField] = undefined;
            }
        };

        Endpoint.ensureIsEndpoint = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'Endpoint', ['send', 'receive']);
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'Endpoint', ['address', 'inboundTransport', 'outboundTransport', 'errorTransport', 'serializer']);
        };


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

        return Endpoint;
    }());
});