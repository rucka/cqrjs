"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Pipeline.Sinks");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Pipeline.Sinks.MessageRouter = (function () {
        var outputField = System.ComponentModel.PrivateName();
        var contextTypeField = System.ComponentModel.PrivateName();

        var MessageRouter = function (sinks) {
            this[outputField] = _(sinks).isUndefined() ? [] : _(sinks).map(function(s) {
                ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(s);
                return s;
            });

            Object.defineProperty(this, 'sinks', {
                enumerate: true,
                writable: false,
                value: this[outputField]
            });

            Object.defineProperty(this, 'sinkCount', {
                enumerate: true,
                get: function () {
                    return this[outputField].length;
                }
            });
        }

        MessageRouter.prototype.inspect = function(inspector) {
            var output = this[outputField];
            return inspector.inspect(this, function () {
                _(output).each(function (sink) {
                    sink.inspect(inspector);
                });
            });
        };

        MessageRouter.prototype.enumerate = function(context) {
            var output = this[outputField];
            var enumeration = _(output).
                map(function(s){
                    var items = s.enumerate(context);
                    return items;
                });
            var results = _(enumeration).
                flatten();
            return results;
        };

        MessageRouter.prototype.connect = function(sink) {
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(sink);
            var that = this;
            this[outputField].push(sink);
            return function () {
                that[outputField] = _(that[outputField]).reject(function(s) {return s !== sink;});
            };
        };

        MessageRouter.prototype.setContextType = function(contextType, messageType) {
            if (_(messageType).isUndefined()) {
                this[contextTypeField] = contextType;
            } else {
                this[contextTypeField] = contextType + '[' + messageType + ']';
            }
        };

        MessageRouter.prototype.getContextType = function() {
            return this[contextTypeField];
        };

        MessageRouter.isMessageRouter = function (instance) {
            try {
                MessageRouter.ensureIsMessageRouter(instance);
                return true;
            } catch (e) {
                return false;
            }
        };

        MessageRouter.ensureIsMessageRouter = function (instance) {
            ServiceBus.Pipeline.PipelineSink.ensureIsPipelineSink(instance);
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'MessageRouter', ['getContextType', 'setContextType', 'inspect', 'connect']);
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'MessageRouter', ['sinks', 'sinkCount']);
        };

        return MessageRouter;
    }());
});