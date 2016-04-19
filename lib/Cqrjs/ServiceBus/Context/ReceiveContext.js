"use strict";
define(['extends', '../../../root', 'mdcore', 'underscore'], function (__extends, Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Context");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Context.ReceiveContext = (function (_super) {
        __extends(ReceiveContext, _super);

        var serviceName = 'ReceiveContext';

        var idField = System.ComponentModel.PrivateName();
        var faultCallbacksField = System.ComponentModel.PrivateName();
        var timerField = System.ComponentModel.PrivateName();
        var sentField = System.ComponentModel.PrivateName();
        var publishedField = System.ComponentModel.PrivateName();
        var receivedField = System.ComponentModel.PrivateName();
        var bodyStreamField = System.ComponentModel.PrivateName();
        var transactionalField = System.ComponentModel.PrivateName();
        var endpointField = System.ComponentModel.PrivateName();
        var busField = System.ComponentModel.PrivateName();
        var typeConverterField = System.ComponentModel.PrivateName();

        function ReceiveContext (bodyStream, transactional) {
            _super.call(this);
            var that = this;

            this[idField] = new System.ComponentModel.Guid();
            this[faultCallbacksField] = [];
            this[timerField] = process.hrtime();
            this[sentField] = [];
            this[publishedField] = [];
            this[receivedField] = [];
            this[bodyStreamField] = bodyStream;
            this[transactionalField] = transactional;

            Object.defineProperty(this, 'baseContext', {
                enumerable: true,
                writable: false,
                value : this
            });

            Object.defineProperty(this, 'endpoint', {
                enumerable: true,
                get : function() {return that[endpointField];}
            });

            Object.defineProperty(this, 'bus', {
                enumerable: true,
                get : function() {return that[busField];}
            });

            Object.defineProperty(this, 'bodyStream', {
                enumerable: true,
                get : function() {
                    return that[bodyStreamField];
                }
            });

            Object.defineProperty(this, 'sent', {
                enumerable: true,
                get : function() {
                    return that[sentField];
                }
            });

            Object.defineProperty(this, 'received', {
                enumerable: true,
                get : function() {
                    return that[receivedField];
                }
            });

            Object.defineProperty(this, 'isTransactional', {
                enumerable: true,
                get : function() {
                    return that[transactionalField];
                }
            });
        };

        ReceiveContext.prototype.setBus = function (bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            this[busField] = bus;
        };

        ReceiveContext.prototype.setEndpoint = function (endpoint) {
            ServiceBus.Transports.Endpoint.ensureIsEndpoint(endpoint);
            this[endpointField] = endpoint;
        };

        ReceiveContext.prototype.setBodyStream = function (stream) {
            if (_(stream).isUndefined()){
                throw new Error('stream must be provided');
            }
            this[bodyStreamField] = stream;
        };

        ReceiveContext.prototype.notifyConsume = function (consumerContext, consumerType, correlationId) {
            ServiceBus.Context.ConsumeContext.ensureIsConsumeContext(consumerContext);
            if (!_(this.endpoint).isUndefined()) {
                this.endpoint.address.logReceive(consumerContext.messageId, consumerContext.messageType);
            }
            this.received.push(createReceived(consumerContext, consumerType, correlationId, process.hrtime(this[timerField])));
        };

        ReceiveContext.prototype.notifyFault = function (faultCallback) {
            if (!_(faultCallback).isFunction()) {throw new Error('Expected faullCallback as function');}
            this[faultCallbacksField].push(faultCallback);
        };

        ReceiveContext.prototype.notifyPublish = function (publishContext) {
            throw new Error('notifyPublish not yet implemeted');
        };

        ReceiveContext.prototype.notifySend = function (sendContext, address) {
            throw new Error('notifySend not yet implemeted');
        };

        ReceiveContext.prototype.copyToBody = function (stream) {
            this[bodyStreamField].copyTo(stream);
        };

        ReceiveContext.prototype.publishPendingFaults = function () {
            var that = this;
            try
            {
                _(this[faultCallbacksField]).each(function (callback) {
                    callback(that.bus);
                });
            }
            catch (ex)
            {
                logerror("Failed to publish pending fault: " + ex.message);
            }
        };

        ReceiveContext.prototype.tryGetContext = function (messageType) {
            try {
                if (_(this[typeConverterField]).isUndefined()) {
                    return {
                        hasContext : false, context : undefined
                    };
                }
                var result = this[typeConverterField].tryConverter(messageType);
                if (!result.hasMessage) {
                    return {
                        hasContext : false, context : undefined
                    };
                }
                var message = result.message;
                var context = new ServiceBus.Context.ConsumeContext(messageType, this, message);
                return {
                    hasContext : true, context: context
                };
            } catch (e) {
                var error = new Error('Failed to deserialize the message');
                error.innerError = e;
                throw error;
            }

        };

        ReceiveContext.prototype.setMessageTypeConverter = function (typeconverter) {
            System.ComponentModel.Object.prototype.ensureHasMethods(typeconverter, 'TypeConverter', ['contains', 'tryConverter']);
            this[typeConverterField] = typeconverter;
        };

        ReceiveContext.prototype.respond = function (message, contextCallback) {
            throw new Error('respond not yet implemeted');
        };

        ReceiveContext.prototype.setUsingEnvelope = function(envelope) {
            var that = this;
            this.setRequestId(envelope.requestId);
            this.setConversationId(envelope.conversationId);
            this.setCorrelationId(envelope.correlationId);
            this.setSourceAddress(envelope.sourceAddress);
            this.setDestinationAddress(envelope.destinationAddress);
            this.setResponseAddress(envelope.responseAddress);
            this.setFaultAddress(envelope.faultAddress);
            this.setNetwork(envelope.network);
            this.setRetryCount(envelope.retryCount);
            if (!_(envelope.expirationTime).isUndefined()) {
                this.setExpirationTime(envelope.expirationTime);
            }
            _(envelope).each(function(header) {
                that.setHeader(header.key, header.value);
            });
        };

        function createReceived(context, consumeType, correlationId, timestamp) {
            var item = {};
            item.timestamp = timestamp;
            item.consumerType = consumeType;
            item.correlationId = correlationId;
            item.context = context;

            Object.defineProperty(item, 'messageType', {
                enumerable: true,
                get : function() {
                    return context.messageName;
                }
            });

            Object.defineProperty(item, 'receiverType', {
                enumerable: true,
                get : function() {
                    return consumeType;
                }
            });

            return item;
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

        return {
            empty : function () {return new ReceiveContext(null, false);},
            fromBodyStream : function (bodyStream, transactional) {return new ReceiveContext(bodyStream, transactional === true);},
            ensureIsReceiveContext : function (instance) {
                ServiceBus.Context.MessageContext.ensureIsMessageContext(instance);
               // throw new Error ('ensureIsReceiveContext not yet implemented.');
                //System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'PipelineSink', ['enumerate', 'inspect']);
            }
        };
    }(ServiceBus.Context.MessageContext));
});