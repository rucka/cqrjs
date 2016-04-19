"use strict";
define(['../../../../root', 'mdcore', 'underscore','url','mongodb', 'Q'], function (Cqrjs, System, _, url, Mongodb, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.MongoDb");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.MongoDb.MongoDbTransportFactory = (function () {
        var transportsField = System.ComponentModel.PrivateName();
        var connectionFactoryField = System.ComponentModel.PrivateName();
        var inboundInitPromiseField = System.ComponentModel.PrivateName();
        var outboundInitPromiseField = System.ComponentModel.PrivateName();

        function MongoDbTransportFactory(connectionFactory) {
            this[transportsField] = {};
            Object.defineProperty(this, 'scheme',{
               enumerable:true,
                writable:false,
                value : 'mongodb'
            });

            if (!_(connectionFactory).isUndefined() && !_(connectionFactory).isFunction()) {
                throw new Error('ConnectionFactory must be a function');
            }

            if (!_(connectionFactory).isUndefined()){
                this[connectionFactoryField] = connectionFactory;
            } else {
                this[connectionFactoryField] = function (serverip, port, dbname) {
                    var server = new Mongodb.Server(serverip, port, {});
                    var db = new Mongodb.Db(dbname, server, {safe : true});
                    return db;
                };
            }

            this[inboundInitPromiseField] = Q.fcall(function (){});
            this[outboundInitPromiseField] = Q.fcall(function (){});
        }

        MongoDbTransportFactory.prototype.setConnectionFactory = function(connectionFactory) {
            if (_(connectionFactory).isUndefined() || !_(connectionFactory).isFunction()) {
                throw new Error('ConnectionFactory must be a function');
            }
            this[connectionFactoryField] = connectionFactory;
        };

        MongoDbTransportFactory.prototype.buildLoopback = function(settings) {
            ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(settings);

            try {
                var mongoEndpointAddress = new ServiceBus.Transports.MongoDb.MongoDbEndpointAddress(settings.address.uri, this[connectionFactoryField]);
                var mongoSettings = getTransportSettings(settings, mongoEndpointAddress);

                var inboundTransport = this.buildInbound(settings);
                var outboundTransport = this.buildOutbound(settings);

                return new ServiceBus.Transports.Transport(mongoSettings.address, function () {return inboundTransport;}, function () {return outboundTransport;});
            }
            catch (e) {
                var error = new Error('Failed to create MongoDb transport');
                error.uri = settings.address.uri;
                error.getErrorType = function () {return 'TransportError'};
                error.innerError = e;
                throw new error;
            }
        };

        MongoDbTransportFactory.prototype.buildInbound = function(settings) {
            try {
                var that = this;

                var address = new ServiceBus.Transports.MongoDb.MongoDbEndpointAddress(settings.address.uri, this[connectionFactoryField]);
                this.ensureProtocolIsCorrect(address.uri);

                if (address.isLocal && settings.purgeExistingMessages) {
                    var db = address.createDb();
                    var mongo = new System.Data.Mongo.MongoDb(db);
                    var error;

                    var idefer = Q.defer();
                    var odefer = Q.defer();

                    mongo.
                        openCollection(address.collectionName).
                        remove({}).
                        done().
                        fail(function (e) {
                            error = e;
                        }).
                        close(function () {
                            if (error) {
                                idefer.reject(e);
                                odefer.reject(e);
                            } else {
                                idefer.resolve();
                                odefer.resolve();
                            }
                        });
                    that[inboundInitPromiseField] = idefer.promise;
                    that[outboundInitPromiseField] = odefer.promise;
                }

                return new ServiceBus.Transports.MongoDb.InboundMongoDbTransport(address, this[inboundInitPromiseField]);
            } catch (e) {
                var error = new Error('Failed to create MongoDb inbound transport');
                error.uri = settings.address.uri;
                error.getErrorType = function () {return 'TransportError'};
                error.innerError = e;
                throw new error;
            }
        };

        MongoDbTransportFactory.prototype.buildOutbound = function(settings) {
            try {
                var address = new ServiceBus.Transports.MongoDb.MongoDbEndpointAddress(settings.address.uri, this[connectionFactoryField]);
                this.ensureProtocolIsCorrect(address.uri);

                return new ServiceBus.Transports.MongoDb.OutboundMongoDbTransport(address, this[outboundInitPromiseField]);
            } catch (e) {
                var error = new Error('Failed to create MongoDb outbound transport');
                error.uri = settings.address.uri;
                error.getErrorType = function () {return 'TransportError'};
                error.innerError = e;
                throw new error;
            }
        };

        MongoDbTransportFactory.prototype.buildError = function(settings) {
            return this.buildOutbound(settings);
        };

        MongoDbTransportFactory.prototype.ensureProtocolIsCorrect = function (uri) {
            if (uri.scheme != 'mongodb') {
                throw new Error ("Address must start with 'mongodb' not '{0}'".replace('{0}', uri.scheme));
            }
        };

        function getTransportSettings (settings, endpointAddress) {
            var mongoSettings = new ServiceBus.Transports.TransportSettings(endpointAddress, settings);
            mongoSettings.createIfMissing = settings.createIfMissing;
            mongoSettings.isolationLevel = settings.isolationLevel;
            mongoSettings.purgeExistingMessages = settings.purgeExistingMessages;
            mongoSettings.requireTransactional = settings.requireTransactional;
            mongoSettings.transactional = endpointAddress.isTransactional;
            mongoSettings.transactionTimeout = settings.transactionTimeout;
            return mongoSettings;
        }

        /*
        public IMessageNameFormatter MessageNameFormatter
        {
            get { return _messageNameFormatter; }
        }*/

        MongoDbTransportFactory.prototype.dispose = function() {

        };

        return MongoDbTransportFactory;
    }());
});