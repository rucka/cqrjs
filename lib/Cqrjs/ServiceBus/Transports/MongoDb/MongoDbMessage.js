"use strict";
define(['../../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.MongoDb");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.MongoDb.MongoDbMessage = (function () {
        var bodyField = System.ComponentModel.PrivateName();
        var messageIdField = System.ComponentModel.PrivateName();

        function MongoDbMessage() {
            var that = this;
            this[bodyField] = new ServiceBus.Transports.Stream();

            this.originalMessageId = undefined;
            this.contentType = undefined;
            this.expirationTime = undefined;
            this[messageIdField] = System.ComponentModel.Guid.NewGuid().asString();

            Object.defineProperty(this, 'body', {
                enumerable: true,
                get : function () { return that[bodyField];}
            });

            Object.defineProperty(this, 'messageId', {
                enumerable: true,
                get : function () { return that[messageIdField];}
            });
        }

        MongoDbMessage.prototype.toSnapshot = function () {
            var buffer = new Array(this.body.length);
            this.body.read(buffer);
            return {
                messageId : this.messageId,
                contentType : this.contentType,
                expirationTime: this.expirationTime,
                body: buffer
            };
        };

        MongoDbMessage.prototype.dispose = function () {
        };

        MongoDbMessage.fromSnapshot = function (snapshot) {
            var message = new MongoDbMessage();
            message.body.write(snapshot.body);
            message.expirationTime = snapshot.expirationTime;
            message.contentType = snapshot.contentType;
            message.originalMessageId = snapshot.originalMessageId;
            message[messageIdField] = snapshot.messageId;
            return message;
        };

        MongoDbMessage.ensureIsSnapshot = function (snapshot) {
            System.ComponentModel.Object.prototype.ensureHasProperties(snapshot, 'message from queue', ['body', 'contentType', 'messageId']);
        };

        return MongoDbMessage;
    }());
});