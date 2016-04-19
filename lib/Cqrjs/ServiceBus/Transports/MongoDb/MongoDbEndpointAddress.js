"use strict";
define(['extends', '../../../../root', 'mdcore', 'underscore'], function (__extends, Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.MongoDb");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.MongoDb.MongoDbEndpointAddress = (function (_super) {
        __extends(MongoDbEndpointAddress, _super);

        var connectionFactoryField = System.ComponentModel.PrivateName();

        function MongoDbEndpointAddress(uri, connectionFactory) {
            _super.call(this, uri);

            if (!_(connectionFactory).isUndefined() && !_(connectionFactory).isFunction()) {
                throw new Error('ConnectionFactory must be a function');
            }
            this[connectionFactoryField] = connectionFactory;

            Object.defineProperty(this, 'collectionName', {
                enumerable: true,
                writable:false,
                value: 'bus'
            });
        }

        MongoDbEndpointAddress.prototype.createDb = function () {
            var connectionFactory = this[connectionFactoryField];
            var addressString = this.toString();

            var re = /mongodb:\/\/([^:]*):?(\d+)?\/(.+)/i;
            var match = addressString.match(re);
            if (match.length !== 4) {
                throw new Error('Connection String "' + addressString + '" not in valid format');
            }
            var host = match[1];
            var port = match[2] && match[2] !== '' ? parseInt(match[2]) : 27017;
            var dbname = match[3];

            var db = connectionFactory(host, port, dbname);
            return db;
        };

        MongoDbEndpointAddress.prototype.dispose = function () {
        };

        MongoDbEndpointAddress.ensureIMongoDbEndpointAddress = function (instance) {
            ServiceBus.EndpointAddress.ensureIsEndpointAddress(instance);
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'MongoDbEndpointAddress', ['createDb']);
        };

        return MongoDbEndpointAddress;
    }(ServiceBus.EndpointAddress));
});