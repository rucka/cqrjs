"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Sinks");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.Sinks.EndpointMessageSink = (function () {
        var endpointField = System.ComponentModel.PrivateName();
        var outputField = System.ComponentModel.PrivateName();

        var EndpointMessageSink = function (output, endpoint) {
            this[outputField] = output;
            this[endpointField] = endpoint;
        };

        EndpointMessageSink.prototype.enumerate = function (context) {
            var that = this;
            return [function (x) {
                var endpoint = that[endpointField];
                if (x.wasEndpointAlreadySent(endpoint.address)) {
                    return;
                }
                return endpoint.send(x);
            }];
        };

        EndpointMessageSink.prototype.inspect = function (inspector) {
            inspector.inspect(this);
            return true;
        };

        return EndpointMessageSink;
    }());
});