"use strict";
define(['../../../../root', 'mdcore', 'underscore', 'Q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.MongoDb");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.MongoDb.OutboundMongoDbTransport = (function () {
        var addressField = System.ComponentModel.PrivateName();
        var initPromiseField = System.ComponentModel.PrivateName();
        var initDoneField = System.ComponentModel.PrivateName();

        function OutboundMongoDbTransport(address, initPromise) {
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

        OutboundMongoDbTransport.prototype.send = function (context) {
            var message;
            var that = this;

            var promise = Q.fcall(function () {
                message = new ServiceBus.Transports.MongoDb.MongoDbMessage();

                if (!_(context.expirationTime).isUndefined()) {
                    message.expirationTime = context.expirationTime;
                }

                context.serializeTo(message.body);
                message.contentType = context.contentType;
                message.originalMessageId = context.originalMessageId;

                var messageSnapshot = message.toSnapshot();
                messageSnapshot.timestamp = new Date();

                var error;
                var defer = Q.defer();

                var db = that.address.createDb();
                var mongo = new System.Data.Mongo.MongoDb(db);
                mongo.
                    openCollection(that.address.collectionName).
                    insert(messageSnapshot).
                    done().
                    fail(function (e) {
                        error = e;
                    }).
                    close(function () {
                        if (error) {
                            defer.reject(error);
                        } else {
                            defer.resolve();
                        }
                    });
                return defer.promise;
            }).fail(function (e) {
                if (message) {message.dispose();}
                throw e;
            });

            if (!this[initDoneField]) {
                var r = promise;
                promise = this[initPromiseField].then(function () {
                    return r;
                });
                this[initDoneField] = true;
            }

            return promise;
        };

        OutboundMongoDbTransport.prototype.dispose = function () {
        };

        return OutboundMongoDbTransport;
    }());
});