"use strict";
define(['../../../root', 'mdcore', 'underscore', 'events'], function (Cqrjs, System, _, events) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.Loopback");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.Transport = (function () {
        var disposedField = System.ComponentModel.PrivateName();

        var addressField = System.ComponentModel.PrivateName();
        var inboundField = System.ComponentModel.PrivateName();
        var outboundField = System.ComponentModel.PrivateName();

        function Transport(address, inboundFactory, outboundFactory) {
            var that = this;

            ServiceBus.EndpointAddress.ensureIsEndpointAddress(address);
            if (!_(inboundFactory).isFunction()) {
                throw new Error('inboundFactory must be provided as function');
            }

            if (!_(outboundFactory).isFunction()) {
                throw new Error('inboundFactory must be provided as function');
            }

            this[addressField] = address;

            Object.defineProperty(this, 'address', {
                enumerable : true,
                writable : false,
                value : address
            });

            Object.defineProperty(this, 'inboundTransport', {
                enumerable : true,
                get : function () {
                    if (_(that[inboundField]).isUndefined()) {
                        that[inboundField] = inboundFactory();
                    }
                    return that[inboundField];
                }
            });

            Object.defineProperty(this, 'outboundTransport', {
                enumerable : true,
                get : function () {
                    if (_(that[outboundField]).isUndefined()) {
                        that[outboundField] = outboundFactory();
                    }
                    return that[outboundField];
                }
            });

            this[disposedField] = false;
        }

        Transport.prototype.send = function (context) {
            return this.outboundTransport.send(context);
        };

        Transport.prototype.receive = function (callback, timeout) {
            if (this[disposedField]) {
                throw new Error('The transport has already been disposed: " + this.address.uri.toString()');
            }
            return this.inboundTransport.receive(callback, timeout);
        };

        Transport.prototype.dispose = function () {
            if (!this[inboundField].isUndefined()) {
                this[inboundField].dispose();
                this[inboundField] = undefined;
            }

            if (!this[outboundField].isUndefined()) {
                this[outboundField].dispose();
                this[outboundField] = undefined;
            }
            this[disposedField] = true;
        };

        return Transport;
    }());
});