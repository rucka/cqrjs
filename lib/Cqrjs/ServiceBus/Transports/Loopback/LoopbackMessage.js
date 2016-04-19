"use strict";
define(['../../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.Loopback");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.Loopback.LoopbackMessage = (function () {
        var bodyField = System.ComponentModel.PrivateName();

        function LoopbackMessage() {
            var that = this;
            this[bodyField] = new ServiceBus.Transports.Stream();

            this.originalMessageId = undefined;
            this.contentType = undefined;
            this.expirationTime = undefined;
            var messageId = System.ComponentModel.Guid.NewGuid().asString();

            Object.defineProperty(this, 'body', {
                enumerable: true,
                get : function () { return that[bodyField];}
            });

            Object.defineProperty(this, 'messageId', {
                enumerable: true,
                get : function () { return messageId;}
            });
        }

        LoopbackMessage.prototype.dispose = function () {
        };

        return LoopbackMessage;
    }());
});