"use strict";
define(['extends', '../../../root', 'mdcore', 'underscore'], function (__extends, Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Context");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.Context.MoveMessageSendContext = (function (_super) {
        __extends(MoveMessageSendContext, _super);

        var bodyWriterField = System.ComponentModel.PrivateName();
        var notifySendField = System.ComponentModel.PrivateName();

        function MoveMessageSendContext (context) {
            var that = this;
            _super.call(this);

            ServiceBus.Context.MessageContext.ensureIsMessageContext(context);
            this.setUsing(context);

            this.id = context.id;

            this[notifySendField] = function (address) {context.notifySend(address);};
            this[bodyWriterField] = function (stream) {context.copyToBody(stream);};

            Object.defineProperty(this, 'declaringType', {
                enumerable:true,
                writable:false,
                value: 'Object'
            });

            this.setOriginalMessageId(context.originalMessageId);

            if (_(this.originalMessageId).isUndefined()) { this.setOriginalMessageId(context.messageId);}
        }


        MoveMessageSendContext.prototype.serializeTo = function (stream) {
            var bodyWriter = this[bodyWriterField];
            bodyWriter(stream);
        };

        MoveMessageSendContext.prototype.notifySend = function (address) {
            var notifySend = this[notifySendField];
            notifySend.notifySend(address);
        };

        MoveMessageSendContext.prototype.tryGetContext = function (messageType) {
            var error = new Error('The message type is unknown and can not be type-cast');
            errore.messageType = messageType;
            error.errorType = 'MessageError';
            throw error;
        };

        MoveMessageSendContext.ensureIsPublishContext = function (instance) {
            ServiceBus.Context.MessageContext.ensureIsMessageContext(instance);
            //System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'PublishContext', ['enumerate', 'inspect']);
        };

        return MoveMessageSendContext;
    }(ServiceBus.Context.MessageContext));


    /*
        ServiceBus.Context.PublishContext = (function () {
            var idField = System.ComponentModel.PrivateName();

            var messageField = System.ComponentModel.PrivateName();
            var bodyWriterField = System.ComponentModel.PrivateName();

            var messageIdField = System.ComponentModel.PrivateName();
            var requestIdField = System.ComponentModel.PrivateName();
            var correlationIdField = System.ComponentModel.PrivateName();
            var conversationIdField = System.ComponentModel.PrivateName();
            var messageTypeField = System.ComponentModel.PrivateName();
            var networkField = System.ComponentModel.PrivateName();

            var responseAddressField = System.ComponentModel.PrivateName();
            var faultAddressField = System.ComponentModel.PrivateName();

            var expirationTimeField = System.ComponentModel.PrivateName();
            var retryCountField = System.ComponentModel.PrivateName();
            var contentTypeField = System.ComponentModel.PrivateName();

            var sourceAddressField = System.ComponentModel.PrivateName();
            var destinationAddressField = System.ComponentModel.PrivateName();

            var messageHeadersField = System.ComponentModel.PrivateName();
            var endpointsField = System.ComponentModel.PrivateName();
            var wasEndpointAlreadySentField = System.ComponentModel.PrivateName();
            var notifySendField = System.ComponentModel.PrivateName();

            var noSubscribersActionField = System.ComponentModel.PrivateName();
            var eachSubscriberActionField = System.ComponentModel.PrivateName();

            var hrTimeStartField = System.ComponentModel.PrivateName();
            var hrTimeStopField = System.ComponentModel.PrivateName();

            var receiveContextField = System.ComponentModel.PrivateName();

            var PublishContext = function (messagetype, message, context) {
                var that = this;

                if (!_(messagetype).isString())
                {
                    throw new Error('message type must be provided as first string paramenter or trought getMessageType');
                }

                if (_(message).isUndefined()) {
                    throw new Error('message not provided');
                }

                this.setMessage(message);

                this[endpointsField] = {};
                this[messageHeadersField] = {};
                this[messageTypeField] = _(messagetype).clone();

                Object.defineProperty(this, 'messageId', {
                    enumerable: true,
                    get: function() {return that[messageIdField];}
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

                Object.defineProperty(this, 'expirationTime', {
                    enumerable: true,
                    get: function() {return that[expirationTimeField];}
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

                Object.defineProperty(this, 'message', {
                    enumerable: true,
                    get: function() {return that[messageField];}
                });

                this[idField] = new System.ComponentModel.Guid();

                this[hrTimeStartField] = process.hrtime();
                this[wasEndpointAlreadySentField] = function(endpoint) {
                    var endpoints = that[endpointsField];
                    var endpointString = endpoint.toString();
                    return !_(endpoints[endpointString]).isUndefined();
                };
                this[receiveContextField] = context;
                this[notifySendField] = context;

                this[noSubscribersActionField] = function (){};
                this[eachSubscriberActionField] = function (){};

                if (!_(context).isUndefined()) {
                    setUsing(this, context);
                }
            };

            function setUsing(instance, context) {
                instance.setRequestId(context.requestId);
                instance.setMessageId(context.messageId);
                instance.setMessageType(context.messageType);

                instance.setConversationId(context.conversationId);
                instance.setCorrelationId(context.correlationId);

                instance.setSourceAddress(context.sourceAddress);
                instance.setDestinationAddress(context.destinationAddress);

                instance.setResponseAddress(context.responseAddress);
                instance.setFaultAddress(context.faultAddress);

                instance.setNetwork(context.network);
                instance[messageHeadersField] = _(context.headers).clone();

                if (!_(context.expirationTime).isUndefined()) {instance.setExpirationTime(context.expirationTime);}

                instance.setRetryCount(context.retryCount);
                instance.setContentType(context.contentType);
            }

            PublishContext.prototype.setMessageId = function (messageId) {
                if (!_(messageId).isUndefined() && !_(messageId).isString()) {throw new Error('Expected messageId as string');}
                this[messageIdField] = messageId;
            };

            PublishContext.prototype.setRequestId = function (request) {
                if (!_(request).isUndefined() && !_(request).isString()) {throw new Error('Expected requestId as string');}
                this[requestIdField] = request;
            };

            PublishContext.prototype.setNetwork = function (network) {
                if (!_(network).isUndefined() && !_(network).isString()) {throw new Error('Expected network as string');}
                this[networkField] = network;
            };

            PublishContext.prototype.setCorrelationId = function (correlationId) {
                if (!_(correlationId).isUndefined() && !_(correlationId).isString()) {throw new Error('Expected correlationId as string');}
                this[correlationIdField] = correlationId;
            };

            PublishContext.prototype.setConversationId = function (conversationId) {
                if (!_(conversationId).isUndefined() && !_(conversationId).isString()) {throw new Error('Expected conversationId as string');}
                this[conversationIdField] = conversationId;
            };

            PublishContext.prototype.setMessageType = function (messageType) {
                if (!_(messageType).isUndefined() && !_(messageType).isString()) {throw new Error('Expected message type as string');}
                this[messageTypeField] = messageType;
            };

            PublishContext.prototype.setExpirationTime = function (expirationTime) {
               // if (!_(expirationTime).isDate()) {throw new Error('Expected expirationTime as time');}
                this[expirationTimeField] = expirationTime;
            };

            PublishContext.prototype.setContentType = function (contentType) {
                if (!_(contentType).isUndefined() && !_(contentType).isString()) {throw new Error('Expected contentType as string');}
                this[contentTypeField] = contentType;
            };

            PublishContext.prototype.setRetryCount = function (retryCount) {
                if (_(retryCount).isUndefined()) {this[retryCountField] = 0; return;}
                if (!_(retryCount).isNumber()) {throw new Error('Expected retryCount as number');}
                this[retryCountField] = retryCount;
            };

            PublishContext.prototype.setSourceAddress = function (uri) {
                if (_(uri).isUndefined()){this[sourceAddressField] = uri; return;}
                ServiceBus.Uri.ensureIsUri(uri);
                this[sourceAddressField] = uri;
            };

            PublishContext.prototype.setDestinationAddress = function (uri) {
                if (_(uri).isUndefined()){this[destinationAddressField] = uri; return;}
                ServiceBus.Uri.ensureIsUri(uri);
                this[destinationAddressField] = uri;
            };

            PublishContext.prototype.setResponseAddress = function (uri) {
                if (_(uri).isUndefined()){this[responseAddressField] = uri; return;}
                ServiceBus.Uri.ensureIsUri(uri);
                this[responseAddressField] = uri;
            };

            PublishContext.prototype.setFaultAddress = function (uri) {
                if (_(uri).isUndefined()){this[faultAddressField] = uri; return;}
                ServiceBus.Uri.ensureIsUri(uri);
                this[faultAddressField] = uri;
            };

            PublishContext.prototype.setMessage = function (message) {
                this[messageField] = message;
            };

            PublishContext.prototype.setBodyWriter = function (bodyWriter) {
                if(!_(bodyWriter).isFunction()) {
                    throw new Error('body writer must be a function');
                }
                this[bodyWriterField] = bodyWriter;
            };

            PublishContext.prototype.serializeTo = function (stream) {
                var bodyWriter = this[bodyWriterField];
                if (_(bodyWriter).isUndefined()) {throw new Error('No message body writer was specified');}
                bodyWriter(stream);
            };

            PublishContext.prototype.ifNoSubscribers = function (action) {
                if (!_(action).isFunction()) {
                    throw new Error ('action must be a function.');
                }
                this[noSubscribersActionField] = action;
            };

            PublishContext.prototype.wasEndpointAlreadySent = function (address) {
                var uri = address.uri;
                ServiceBus.Uri.ensureIsUri(uri);
                return this[wasEndpointAlreadySentField](uri);
            };

            PublishContext.prototype.notifyNoSubscribers = function () {
                this[noSubscribersActionField]();
            };

            PublishContext.prototype.notifySend = function (address) {
                var notifySend = this[notifySendField];
                if (!_(notifySend).isUndefined()) {
                    notifySend.notifySend(address);
                    return;
                }
                this[endpointsField][address.toString()] = address;
                this[eachSubscriberActionField](address);
                if (!_(this[receiveContextField]).isUndefined()) {
                    this[receiveContextField].notifySend(address);
                }
            };

            PublishContext.prototype.forEachSubscriber = function (action) {
                if (!_(action).isFunction()) {
                    throw new Error ('action must be a function.');
                }
                this[eachSubscriberActionField] = action;
            };

            PublishContext.prototype.complete = function () {
                this[hrTimeStopField] = process.hrtime();
            };

            PublishContext.prototype.tryGetContext = function (messageType) {
                var context = undefined;

                if (messageType === this.declaringMessageType) {
                    var message = this[messageField];
                    var busPublishContext = new PublishContext(messageType, message, this);
                    busPublishContext[wasEndpointAlreadySentField] = this[wasEndpointAlreadySentField];
                    busPublishContext.ifNoSubscribers(this[noSubscribersActionField]);
                    busPublishContext.forEachSubscriber(this[eachSubscriberActionField]);

                    context = busPublishContext;
                }
                return {
                    hasContext : !_(context).isUndefined(), context: context
                };
            };

            PublishContext.ensureIsPublishContext = function (instance) {
                //System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'PublishContext', ['enumerate', 'inspect']);
            };

            return PublishContext;
        }());
    */
});