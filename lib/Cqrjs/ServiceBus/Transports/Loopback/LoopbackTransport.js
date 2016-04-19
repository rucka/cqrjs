"use strict";
define(['../../../../root', 'mdcore', 'underscore', 'events'], function (Cqrjs, System, _, events) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.Loopback");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.Loopback.LoopbackTransport = (function () {
        var addressField = System.ComponentModel.PrivateName();
        var messageListField = System.ComponentModel.PrivateName();

        var eventDispatcher = System.ComponentModel.PrivateName();
        var messageReceivedEventField = System.ComponentModel.PrivateName();

        function LoopbackTransport(address) {
            var that = this;
            this[addressField] = address;
            Object.defineProperty(this, 'inboundTransport', {
                enumerable: true,
                writable: false,
                value : this
            });

            Object.defineProperty(this, 'outboundTransport', {
                enumerable: true,
                writable: false,
                value : this
            });

            Object.defineProperty(this, 'address', {
                enumerable: true,
                writable: false,
                value : address
            });

            Object.defineProperty(this, 'messages', {
                enumerable: true,
                get: function () {return that[messageListField];}
            });

            Object.defineProperty(this, 'count', {
                enumerable: true,
                get: function () {return that[messageListField].length;}
            });


            this[messageListField] = [];
            this[eventDispatcher] = new events.EventEmitter();
            this[eventDispatcher].setMaxListeners(0);
            this[messageReceivedEventField] = System.ComponentModel.Guid.NewGuid().asString();
        }

        LoopbackTransport.prototype.send = function (context) {
            var message;
            var messages = this[messageListField];

            try {
                message = new ServiceBus.Transports.Loopback.LoopbackMessage();
                if (!_(context.expirationTime).isUndefined()) {
                    message.expirationTime = context.expirationTime;
                }

                context.serializeTo(message.body);
                message.contentType = context.contentType;
                message.originalMessageId = context.originalMessageId;

                messages.push(message);

                this.address.logSent(message.messageId, context.messageType);
            } catch (e) {
                if (message) {message.dispose();}
                throw e;
            }
            this[eventDispatcher].emit(this[messageReceivedEventField]);
        };

        LoopbackTransport.prototype.receive = function (callback, timeout) {
            callback = _(callback).once();
            var that = this;

            var dispatcher = this[eventDispatcher];
            var messageReceivedEvent = this[messageReceivedEventField];

            var start = process.hrtime();
            var waitUntilTimeout = function () {
                var towait = timeout - getTotMilliseconds(process.hrtime(start));
                _(function () {
                    //console.warn('remove listener...');
                    dispatcher.removeListener(messageReceivedEvent, _(receive).bind(that));
                    callback();
                }).delay(towait);
            };

            if (this.count === 0) {
                //console.warn('add listener...');
                dispatcher.once(messageReceivedEvent, function() {
                    _(receive).bind(that)(callback);
                });
                waitUntilTimeout();
            } else {
                _(receive).bind(that)(callback);
                waitUntilTimeout();
            }
        };

        var receive = function (callback) {
            var messages = this[messageListField];

            var doReceive = function () {
                if (messages.length === 0) {
                    return;
                }

                var message = messages[0];

                if (!_(message.expirationTime).isUndefined() && message.expirationTime < new Date()) {
                    messages.shift();
                    return;
                }

                var context = ServiceBus.Context.ReceiveContext.fromBodyStream(message.body);
                context.setMessageId(message.messageId);
                context.setContentType(message.contentType);
                context.setOriginalMessageId(message.originalMessageId);
                if (!_(message.expirationTime)) {context.setExpirationTime(message.expirationTime);}

                var r = callback(context);
                if (_(r).isUndefined()) {
                    process.nextTick(function () {
                        doReceive();
                    });
                    return;
                }
                messages.shift();

                try {
                    r(context);
                } finally {
                    message.dispose();
                }
             };
            process.nextTick(function () {
                doReceive();
            });
        };

        function getTotMilliseconds(hrtime) {
            var nanoSec = hrtime[0] * 1e9 + hrtime[1];
            return nanoSec / 1e6;
        }

        LoopbackTransport.prototype.dispose = function () {
            var messageReceivedEvent = this[messageReceivedEventField];
            //console.warn('disposing transport...');
            var dispatcher = this[eventDispatcher];
            //var listeners = dispatcher.listeners(messageReceivedEvent);
            dispatcher.removeAllListeners(messageReceivedEvent);
            //listeners = dispatcher.listeners(messageReceivedEvent);
        };

        return LoopbackTransport;
    }());
});