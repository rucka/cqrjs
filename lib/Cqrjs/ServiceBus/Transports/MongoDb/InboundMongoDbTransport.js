"use strict";
define(['../../../../root', 'mdcore', 'underscore', 'Q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.MongoDb");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.MongoDb.InboundMongoDbTransport = (function () {
        var addressField = System.ComponentModel.PrivateName();
        var initPromiseField = System.ComponentModel.PrivateName();
        var initDoneField = System.ComponentModel.PrivateName();

        function InboundMongoDbTransport(address, initPromise) {
            var that = this;
            ServiceBus.Transports.MongoDb.MongoDbEndpointAddress.ensureIMongoDbEndpointAddress(address);
            this[addressField] = address;

            Object.defineProperty(this, 'address', {
                enumerable: true,
                writable: false,
                value : address
            });
            this[initPromiseField] = initPromise;
            this[initDoneField] = false;
        }

        InboundMongoDbTransport.prototype.receive = function (callback, timeout) {
            var that = this;
            callback = _(callback).once();

            var start = process.hrtime();
            var error;

            var receive = _(receivePromise).bind(that);

            if (!this[initDoneField]) {
                var r = receive;
                receive = this[initPromiseField].then(function () {
                    return r;
                }).then;
                this[initDoneField] = true;
            }

            return receive().
                then (function (message) {
                    var defer = Q.defer();

                    if (!_(message).isNull()) {
                        defer.resolve(message);
                        return defer.promise;
                    }
                    var towait = timeout - getTotMilliseconds(process.hrtime(start));
                    _(function () {
                        receive().
                            then(function (m){
                                defer.resolve(m);
                            }).
                            fail(function (e) {
                                defer.reject(e);
                            });
                    }).delay(towait);

                    return defer.promise;
                }).then (function (message) {
                    if (_(message).isNull() || _(message).isUndefined()) {
                        return;
                    }

                    if (!_(message.expirationTime).isUndefined() && !_(message.expirationTime).isNull() && message.expirationTime < new Date()) {
                        return;
                    }

                    var context = ServiceBus.Context.ReceiveContext.fromBodyStream(message.body);
                    context.setMessageId(message.messageId);
                    context.setContentType(message.contentType);
                    context.setOriginalMessageId(message.originalMessageId);
                    if (!_(message.expirationTime).isNull() && !_(message.expirationTime).isUndefined()) {
                        context.setExpirationTime(message.expirationTime);
                    }
                    var r = callback(context);
                    if (_(r).isUndefined() || !_(r).isFunction()) {
                        return;
                    }

                    try {
                        r(context);
                    } finally {
                        message.dispose();
                    }
                }).then (function () {
                    var towait = timeout - getTotMilliseconds(process.hrtime(start));
                    if (towait <= 0) {
                        callback();
                        return;
                    }
                    var defer = Q.defer();
                    _(defer.resolve).delay(towait);
                    callback();
                    return defer.promise;
                }).fail (function (e) {
                    var error = new Error('Failed to create connection to transport');
                    error.uri = that[addressField].uri;
                    error.getErrorType = function () {return 'InvalidConnectionError'};
                    error.innerError = e;

                    var towait = timeout - getTotMilliseconds(process.hrtime(start));
                    throw new error;
                });
        };

        var receivePromise = function () {
            var that = this;
            var db = that.address.createDb();
            var mongo = new System.Data.Mongo.MongoDb(db);

            var defer = Q.defer();

            var message;
            var error;
            var collectionName = that.address.collectionName;

            mongo.
                openCollection(collectionName).
                findOne({}, {}, {sort : {timestamp : 1}}).
                done(function (m) {
                    ServiceBus.Transports.MongoDb.MongoDbMessage.ensureIsSnapshot(m);
                    message = m;
                }).
                fail(function (e) {
                    error = e;
                }).
                close(function () {
                    if (error) {
                        defer.reject(error);
                    } else {
                        defer.resolve(toMessage(message));
                    }
                });

            var promise = defer.promise;

            return promise.then(function (m) {
                if (_(m).isUndefined() || _(m).isNull()) {
                    return;
                }

                var d = Q.defer();
                mongo.
                    openCollection(collectionName).
                    remove({'messageId': m.messageId}).
                    done().
                    fail(function (e) {
                        error = e;
                    }).
                    close(function () {
                        if (error) {
                            d.reject(error);
                        } else {
                            d.resolve(m);
                        }
                    });
                return d.promise;
            });
        };

        function toMessage (m) {
            if (_(m).isNull() || _(m).isUndefined()) {
                return m;
            }
            return ServiceBus.Transports.MongoDb.MongoDbMessage.fromSnapshot(m);
        }

        function getTotMilliseconds(hrtime) {
            var nanoSec = hrtime[0] * 1e9 + hrtime[1];
            return nanoSec / 1e6;
        }

        InboundMongoDbTransport.prototype.dispose = function () {
            //var messageReceivedEvent = this[messageReceivedEventField];
            ////console.warn('disposing transport...');
            //var dispatcher = this[eventDispatcher];
            ////var listeners = dispatcher.listeners(messageReceivedEvent);
            //dispatcher.removeAllListeners(messageReceivedEvent);
            ////listeners = dispatcher.listeners(messageReceivedEvent);
        };

        return InboundMongoDbTransport;
    }());
});