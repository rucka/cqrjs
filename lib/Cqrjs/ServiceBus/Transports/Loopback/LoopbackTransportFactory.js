"use strict";
define(['../../../../root', 'mdcore','url'], function (Cqrjs, System, url) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports.Loopback");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.Loopback.LoopbackTransportFactory = (function () {
        var transportsField = System.ComponentModel.PrivateName();

        function LoopbackTransportFactory() {
            this[transportsField] = {};
            Object.defineProperty(this, 'scheme',{
               enumerable:true,
                writable:false,
                value : 'loopback'
            });
        }

        LoopbackTransportFactory.prototype.buildLoopback = function(settings) {
            ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(settings);

            var url = settings.address.uri.toString();
            var transports = this[transportsField];
            if (!transports[url]) {
                transports[url] =  new ServiceBus.Transports.Loopback.LoopbackTransport(settings.address);
            }
            return transports[url];
        };

        LoopbackTransportFactory.prototype.buildInbound = function(settings) {
            return this.buildLoopback(settings);
        };

        LoopbackTransportFactory.prototype.buildOutbound = function(settings) {
            return this.buildLoopback(settings);
        };

        LoopbackTransportFactory.prototype.buildError = function(settings) {
            ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(settings);

            var url = settings.address.uri.toString();
            var transports = this[transportsField];
            if (!transports[url]) {
                transports[url] =  new ServiceBus.Transports.Loopback.LoopbackTransport(settings.address);
            }
            return transports[url];
        };

        /*
        public IMessageNameFormatter MessageNameFormatter
        {
            get { return _messageNameFormatter; }
        }*/

        LoopbackTransportFactory.prototype.dispose = function() {

        };

        return LoopbackTransportFactory;
    }());
});