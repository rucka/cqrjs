"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Context");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Context.MessageContext = (function () {
        var messageIdField = System.ComponentModel.PrivateName();
        var originalMessageIdField = System.ComponentModel.PrivateName();
        var requestIdField = System.ComponentModel.PrivateName();
        var correlationIdField = System.ComponentModel.PrivateName();
        var conversationIdField = System.ComponentModel.PrivateName();
        var messageTypeField = System.ComponentModel.PrivateName();
        var networkField = System.ComponentModel.PrivateName();

        var responseAddressField = System.ComponentModel.PrivateName();
        var faultAddressField = System.ComponentModel.PrivateName();

        var retryCountField = System.ComponentModel.PrivateName();
        var contentTypeField = System.ComponentModel.PrivateName();

        var sourceAddressField = System.ComponentModel.PrivateName();
        var destinationAddressField = System.ComponentModel.PrivateName();

        var messageHeadersField = System.ComponentModel.PrivateName();

        var MessageContext = function () {
            var that = this;

            this[messageHeadersField] = {};

            Object.defineProperty(this, 'messageId', {
                enumerable: true,
                get: function() {return that[messageIdField];}
            });

            Object.defineProperty(this, 'originalMessageId', {
                enumerable: true,
                get: function() {return that[originalMessageIdField];}
            });

            Object.defineProperty(this, 'requestId', {
                enumerable: true,
                get: function() {return that[requestIdField];}
            });

            Object.defineProperty(this, 'correlationId', {
                enumerable: true,
                get: function() {return that[correlationIdField];}
            });

            Object.defineProperty(this, 'conversationId', {
                enumerable: true,
                get: function() {return that[conversationIdField];}
            });

            Object.defineProperty(this, 'messageType', {
                enumerable: true,
                get: function() {return that[messageTypeField];}
            });

            Object.defineProperty(this, 'declaringMessageType', {
                enumerable: true,
                get: function() {return that[messageTypeField];}
            });

            Object.defineProperty(this, 'sourceAddress', {
                enumerable: true,
                get: function() {return that[sourceAddressField];}
            });

            Object.defineProperty(this, 'destinationAddress', {
                enumerable: true,
                get: function() {return that[destinationAddressField];}
            });

            Object.defineProperty(this, 'responseAddress', {
                enumerable: true,
                get: function() {return that[responseAddressField];}
            });

            Object.defineProperty(this, 'faultAddress', {
                enumerable: true,
                get: function() {return that[faultAddressField];}
            });

            Object.defineProperty(this, 'network', {
                enumerable: true,
                get: function() {return that[networkField];}
            });

            this[retryCountField] = 0;
            Object.defineProperty(this, 'retryCount', {
                enumerable: true,
                get: function() {return that[retryCountField];}
            });

            Object.defineProperty(this, 'contentType', {
                enumerable: true,
                get: function() {return that[contentTypeField];}
            });

            Object.defineProperty(this, 'headers', {
                enumerable: true,
                get: function() {return that[messageHeadersField];}
            });
        };

        MessageContext.prototype.setUsing = function (context) {
            this.setRequestId(context.requestId);
            this.setMessageId(context.messageId);
            this.setMessageType(context.messageType);

            this.setConversationId(context.conversationId);
            this.setCorrelationId(context.correlationId);

            this.setSourceAddress(context.sourceAddress);
            this.setDestinationAddress(context.destinationAddress);

            this.setResponseAddress(context.responseAddress);
            this.setFaultAddress(context.faultAddress);

            this.setNetwork(context.network);
            this[messageHeadersField] = _(context.headers).clone();

            if (!_(context.expirationTime).isUndefined()) {this.setExpirationTime(context.expirationTime);}

            this.setRetryCount(context.retryCount);
            this.setContentType(context.contentType);
        };

        MessageContext.prototype.setMessageId = function (messageId) {
            if (!_(messageId).isUndefined() && !_(messageId).isString()) {throw new Error('Expected messageId as string');}
            this[messageIdField] = messageId;
        };

        MessageContext.prototype.setOriginalMessageId = function (messageId) {
            if (!_(messageId).isUndefined() && !_(messageId).isString()) {throw new Error('Expected originalMessageId as string');}
            this[originalMessageIdField] = messageId;
        };

        MessageContext.prototype.setRequestId = function (request) {
            if (!_(request).isUndefined() && !_(request).isString()) {throw new Error('Expected requestId as string');}
            this[requestIdField] = request;
        };

        MessageContext.prototype.setNetwork = function (network) {
            if (!_(network).isUndefined() && !_(network).isString()) {throw new Error('Expected network as string');}
            this[networkField] = network;
        };

        MessageContext.prototype.setCorrelationId = function (correlationId) {
            if (!_(correlationId).isUndefined() && !_(correlationId).isString()) {throw new Error('Expected correlationId as string');}
            this[correlationIdField] = correlationId;
        };

        MessageContext.prototype.setConversationId = function (conversationId) {
            if (!_(conversationId).isUndefined() && !_(conversationId).isString()) {throw new Error('Expected conversationId as string');}
            this[conversationIdField] = conversationId;
        };

        MessageContext.prototype.setMessageType = function (messageType) {
            if (!_(messageType).isUndefined() && !_(messageType).isString()) {throw new Error('Expected message type as string');}
            this[messageTypeField] = messageType;
        };

        MessageContext.prototype.setExpirationTime = function (expirationTime) {
           // if (!_(expirationTime).isDate()) {throw new Error('Expected expirationTime as time');}
            this[expirationTimeField] = expirationTime;
        };

        MessageContext.prototype.setContentType = function (contentType) {
            if (!_(contentType).isUndefined() && !_(contentType).isString()) {throw new Error('Expected contentType as string');}
            this[contentTypeField] = contentType;
        };

        MessageContext.prototype.setRetryCount = function (retryCount) {
            if (_(retryCount).isUndefined()) {this[retryCountField] = 0; return;}
            if (!_(retryCount).isNumber()) {throw new Error('Expected retryCount as number');}
            this[retryCountField] = retryCount;
        };

        MessageContext.prototype.setSourceAddress = function (uri) {
            if (_(uri).isUndefined()){this[sourceAddressField] = uri; return;}
            ServiceBus.Uri.ensureIsUri(uri);
            this[sourceAddressField] = uri;
        };

        MessageContext.prototype.setDestinationAddress = function (uri) {
            if (_(uri).isUndefined()){this[destinationAddressField] = uri; return;}
            ServiceBus.Uri.ensureIsUri(uri);
            this[destinationAddressField] = uri;
        };

        MessageContext.prototype.setResponseAddress = function (uri) {
            if (_(uri).isUndefined()){this[responseAddressField] = uri; return;}
            ServiceBus.Uri.ensureIsUri(uri);
            this[responseAddressField] = uri;
        };

        MessageContext.prototype.setFaultAddress = function (uri) {
            if (_(uri).isUndefined()){this[faultAddressField] = uri; return;}
            ServiceBus.Uri.ensureIsUri(uri);
            this[faultAddressField] = uri;
        };

        MessageContext.prototype.setHeader = function (key, value) {
            this[messageHeadersField][key] = value;
        };

        MessageContext.ensureIsMessageContext = function (instance) {
            //System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'PublishContext', ['enumerate', 'inspect']);
        };

        return MessageContext;
    }());
});