"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Serializers");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Serializers.Envelope = (function (){
        var ctor = function () {

        };

        return {
            Create : function(context) {
                var envelope = new ctor();
                envelope.message = context.message;
                envelope.messageType = [context.declaringMessageType];

                envelope.requestId = context.requestId;
                envelope.conversationId = context.conversationId;
                envelope.correlationId = context.correlationId;
                envelope.sourceAddress = !_(context.sourceAddress).isUndefined() ? context.sourceAddress : envelope.sourceAddress;
                envelope.destinationAddress = !_(context.destinationAddress).isUndefined() ? context.destinationAddress : envelope.destinationAddress;
                envelope.responseAddress = !_(context.responseAddress).isUndefined() ? context.responseAddress : envelope.responseAddress;
                envelope.faultAddress = !_(context.faultAddress).isUndefined() ? context.faultAddress : envelope.faultAddress;
                envelope.network = context.network;
                envelope.retryCount = context.retryCount;
                if (!_(context.expirationTime).isUndefined()){
                    envelope.expirationTime = context.expirationTime;
                }
                var header;
                for (header in context.headers) {
                    envelope.headers[header.key] = header.value;
                }
                return envelope;
            }
        };
    }());
});