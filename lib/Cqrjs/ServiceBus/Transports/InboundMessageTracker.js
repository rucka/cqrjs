"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.InboundMessageTracker = (function () {

        function InboundMessageTracker(retryLimit) {
            this.retryLimit = retryLimit;
            this.messages = [];
        }

        InboundMessageTracker.prototype.isRetryLimitExceeded = function (id) {
            var result = {
                exceeded : false,
                retryException : undefined
            };

            if (!_(id).isUndefined() && !_(this.messages).isUndefined()) {
                if (_(this.messages[id]).isUndefined()) {
                    this.messages[id] = createTrackedMessage();
                }

                result.exceeded = this.messages[id].retryCount >= this.retryCount;
                result.retryException = this.messages[id].exception;
            }
            return result;
        };

        InboundMessageTracker.prototype.incrementRetryCount = function (id, exception) {
            if (_(id).isUndefined()) {return false;}

            if (_(this.messages[id]).isUndefined()) {
                this.messages[id] = createTrackedMessage();
            }
            return this.messages[id].increment(exception) >= this.retryLimit;
        };

        InboundMessageTracker.prototype.messageWasReceivedSuccessfully = function (id) {
            if (_(id).isUndefined()) {return;}
            this.messages[id] = undefined;
        };

        InboundMessageTracker.prototype.messageWasMovedToErrorQueue = function (id) {
            if (_(id).isUndefined()) {return;}
            this.messages[id] = undefined;
        };

        InboundMessageTracker.ensureIsInboundMessageTracker = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'InboundMessageTracker', ['isRetryLimitExceeded', 'incrementRetryCount','messageWasReceivedSuccessfully', 'messageWasMovedToErrorQueue']);
        };

        function createTrackedMessage (){
            var instance = {};
            instance.exception;
            instance.retryCount = 0;

            instance.increment = function (exception) {
                instance.retryCount++;
                instance.exception = exception;
                return instance.retryCount;
            }
            return instance;
        }

        return InboundMessageTracker;
    }());
});