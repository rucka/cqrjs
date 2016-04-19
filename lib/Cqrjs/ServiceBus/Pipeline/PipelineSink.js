"use strict";
define(['../../../root', 'mdcore'], function (Cqrjs, System) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.PipelineSink = (function () {
        var PipelineSink = function () {

        }

        PipelineSink.ensureIsPipelineSink = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'PipelineSink', ['enumerate', 'inspect']);
        };

        return PipelineSink;
    }());
});