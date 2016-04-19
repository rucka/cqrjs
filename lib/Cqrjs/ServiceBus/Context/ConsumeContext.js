"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Context");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Context.ConsumeContext = (function () {

        var messageField = System.ComponentModel.PrivateName();
        var contextField = System.ComponentModel.PrivateName();

        var ConsumeContext = function (messagetype, context, message) {
            var that = this;
            if (!_(messagetype).isString())
            {
                throw new Error('message type must be provided as first string paramenter or trought getMessageType');
            }

            if (_(message).isUndefined()) {
                throw new Error('message not provided');
            }

            Object.defineProperty(this, 'messageType', {
                enumerable: true,
                writable: false,
                value: _(messagetype).clone()
            });

            ServiceBus.Context.ReceiveContext.ensureIsReceiveContext(context);

            this[contextField] = context;

            Object.defineProperty(this, 'baseContext', {
                enumerable: true,
                get : function () {return context;}
            });

            Object.defineProperty(this, 'headers', {
                enumerable: true,
                get : function () {return context.headers;}
            });

            Object.defineProperty(this, 'requestId', {
                enumerable: true,
                get : function () {return context.requestId;}
            });

            Object.defineProperty(this, 'conversationId', {
                enumerable: true,
                get : function () {return context.conversationId;}
            });

            Object.defineProperty(this, 'correlationId', {
                enumerable: true,
                get : function () {return context.correlationId;}
            });

            Object.defineProperty(this, 'messageId', {
                enumerable: true,
                get : function () {return context.messageId;}
            });

            Object.defineProperty(this, 'contentType', {
                enumerable: true,
                get : function () {return context.contentType;}
            });

            Object.defineProperty(this, 'sourceAddress', {
                enumerable: true,
                get : function () {return context.sourceAddress;}
            });

            Object.defineProperty(this, 'destinationAddress', {
                enumerable: true,
                get : function () {return context.destinationAddress;}
            });

            Object.defineProperty(this, 'responseAddress', {
                enumerable: true,
                get : function () {return context.responseAddress;}
            });

            Object.defineProperty(this, 'faultAddress', {
                enumerable: true,
                get : function () {return context.faultAddress;}
            });

            Object.defineProperty(this, 'network', {
                enumerable: true,
                get : function () {return context.network;}
            });

            Object.defineProperty(this, 'expirationTime', {
                enumerable: true,
                get : function () {return context.expirationTime;}
            });

            Object.defineProperty(this, 'retryCount', {
                enumerable: true,
                get : function () {return context.retryCount;}
            });

            Object.defineProperty(this, 'bus', {
                enumerable: true,
                get : function () {return context.bus;}
            });

            Object.defineProperty(this, 'endpoint', {
                enumerable: true,
                get : function () {return context.endpoint;}
            });

            Object.defineProperty(this, 'inputAddress', {
                enumerable: true,
                get : function () {return context.inputAddress;}
            });

            this[messageField] = message;
            Object.defineProperty(this, 'message', {
                enumerable: true,
                get : function () {return that[messageField];}
            });
        };

        ConsumeContext.prototype.isContextAvailable = function (messageType) {
            throw new Error ('isContextAvailable not yet implemented');
        };

        ConsumeContext.prototype.tryGetContext = function (messageType) {
            throw new Error ('tryGetContext not yet implemented');
        };

        ConsumeContext.prototype.retryLater = function () {
            throw new Error ('retryLater not yet implemented');
        };

        ConsumeContext.prototype.respond = function (message, contextCallback) {
            this[contextField].respond(message, contextCallback);
        };

        ConsumeContext.prototype.generateFault = function (ex) {
            if (_(this.message).isUndefined()){
                throw new Error ('A fault cannot be generated when no message is present');
            }

            if (this.message.correlationId) {
                this.createAndSendCorrelatedFault(this.message, ex);
            } else {
                this.createAndSendFault(this.message, ex);
            }
        };

        ConsumeContext.prototype.createAndSendFault = function (message, error) {
            var fault = {
                failedMessage : message,
                occurredAt : new Date(),
                messages : createErrorMessages(error),
                stackTrace : createStackTraces(error),
                getMessageType : function () {return 'fault';}
            };
            var that = this;
            this[contextField].notifyFault(function (bus) {
                sendFault(bus, that.faultAddress, that.responseAddress, that.requestId, fault);
            });
        };

        function createErrorMessages (e) {
            var errors = [];
            errors.push(e.message);
            while (!_(e = e.innerError).isUndefined()) {
                errors.push(e.message);
            }
            return errors;
        }

        function createStackTraces (e) {
            var errors = [];
            errors.push('Stack Trace: ' + e.stack);
            while (!_(e = e.innerError).isUndefined()) {
                errors.push('Inner Stack Trace: ' + e.stack);
            }
            return errors;
        }

        ConsumeContext.prototype.createAndSendCorrelatedFault = function (message, exception) {
            throw new Error ('createAndSendCorrelatedFault not yet implemented');
        };


        function sendFault (bus, faultAddress, responseAddress, requestId, message) {
            if (faultAddress) {
                bus.getEndpoint(faultAddress).send(message, function(context) {
                    context.setSourceAddress(bus.endpoint.address.uri);
                    context.setRequestId(requestId);
                });
            } else if (responseAddress) {
                bus.getEndpoint(responseAddress).send(message, function(context) {
                    context.setSourceAddress(bus.endpoint.address.uri);
                    context.setRequestId(requestId);
                });
            } else {
                bus.publish(message, function (context) {context.setRequestId(requestId);});
            }
        }

        ConsumeContext.ensureIsConsumeContext = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'ConsumerContext', ['baseContext', 'messageType', 'message']);
//            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'ConsumerContext', ['']);
            //throw new Error ('ensureIsConsumeContext not yet implemented.');
        };

        return ConsumeContext;
    }());
});