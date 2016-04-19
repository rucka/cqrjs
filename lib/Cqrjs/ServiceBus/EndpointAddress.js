"use strict";
define(['../../root', 'mdcore', 'underscore', 'os'], function (Cqrjs, System, _, os) {
    Cqrjs.namespace("Cqrjs.ServiceBus");
    var ServiceBus = Cqrjs.ServiceBus;
    var serviceName = 'EndpointAddress';

    ServiceBus.EndpointAddress = (function () {
        var LocalMachineName = os.hostname();

        function EndpointAddress(uri) {
            uri = ServiceBus.Uri.isUri(uri) ? uri : new ServiceBus.Uri(uri);

            Object.defineProperty(this, 'uri', {
                enumerable: true,
                writable: false,
                value : uri
            });

            Object.defineProperty(this, 'isTransactional', {
                enumerable: true,
                writable: false,
                value : false
            });

            Object.defineProperty(this, 'isLocal', {
                enumerable: true,
                get: function () {
                    var hostName = uri.url.hostname;
                    var local = hostName === '.' ||
                        hostName === 'localhost' ||
                        uri.url.hostname === LocalMachineName;
                    return local;
                }
            });
        }

        EndpointAddress.prototype.toString = function () {
            return this.uri.toString();
        };

        EndpointAddress.ensureIsEndpointAddress = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'EndpointAddress', ['uri', 'isLocal', 'isTransactional']);
        };

        Object.defineProperty(EndpointAddress, 'Null', {
            enumerable: true,
            writable: false,
            value : new EndpointAddress('null://null/null')
        });

        EndpointAddress.prototype.logSent = function (messageId, description) {
            logdebug(("SEND:{0}:{1}:{2}".
                replace('{0}', this.uri.toString()).
                replace('{1}', messageId).
                replace('{2}', description)));
        };

        EndpointAddress.prototype.logReceive = function (messageId, description) {
            logdebug(("RECV:{0}:{1}:{2}".
                replace('{0}', this.uri.toString()).
                replace('{1}', messageId).
                replace('{2}', description)));
        };

        EndpointAddress.prototype.logSkipped = function (messageId) {
           log(("SKIP:{0}:{1}".
               replace('{0}', this.uri.toString()).
               replace('{1}', messageId)));
        };

        EndpointAddress.prototype.logReQueued = function (destinationAddress, messageId, description) {
            log("RQUE:{0}:{1}:{2}:{3}".
                replace('{0}', this.uri.toString()).
                replace('{1}', destinationAddress.toString()).
                replace('{2}', messageId).
                replace('{3}', description));
        };

        function log (message, level, category, metadata) {
            System.ComponentModel.logger.log(message, level, serviceName, category, metadata);
        }

        function logdebug (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'debug', serviceName, category, metadata);
        }

        function logverbose (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'verbose', serviceName, category, metadata);
        }

        function logwarn (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'warn', serviceName, category, metadata);
        }

        function logerror (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'err', serviceName, category, metadata);
        }

        return EndpointAddress;
    }());
});