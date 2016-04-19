"use strict";
define(['extends', '../../../root', 'mdcore', 'underscore'], function (__extends, Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Context");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.Context.PublishContext = (function (_super) {
        __extends(PublishContext, _super);

        var idField = System.ComponentModel.PrivateName();

        var messageField = System.ComponentModel.PrivateName();
        var bodyWriterField = System.ComponentModel.PrivateName();

        var expirationTimeField = System.ComponentModel.PrivateName();

        var endpointsField = System.ComponentModel.PrivateName();
        var wasEndpointAlreadySentField = System.ComponentModel.PrivateName();
        var notifySendField = System.ComponentModel.PrivateName();

        var noSubscribersActionField = System.ComponentModel.PrivateName();
        var eachSubscriberActionField = System.ComponentModel.PrivateName();

        var hrTimeStartField = System.ComponentModel.PrivateName();
        var hrTimeStopField = System.ComponentModel.PrivateName();

        var receiveContextField = System.ComponentModel.PrivateName();

        function PublishContext (messagetype, message, context) {
            var that = this;
            _super.call(this);

            if (!_(messagetype).isString())
            {
                throw new Error('message type must be provided as first string paramenter or trought getMessageType');
            }
            this.setMessageType(messagetype);

            if (_(message).isUndefined()) {
                throw new Error('message not provided');
            }

            this.setMessage(message);

            this[endpointsField] = {};

            Object.defineProperty(this, 'expirationTime', {
                enumerable: true,
                get: function() {return that[expirationTimeField];}
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
                this.setUsing(context);
            }
        };

        PublishContext.prototype.setExpirationTime = function (expirationTime) {
            // if (!_(expirationTime).isDate()) {throw new Error('Expected expirationTime as time');}
            this[expirationTimeField] = expirationTime;
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
            ServiceBus.Context.MessageContext.ensureIsMessageContext(instance);
            //System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'PublishContext', ['enumerate', 'inspect']);
        };

        return PublishContext;
    }(ServiceBus.Context.MessageContext));

});