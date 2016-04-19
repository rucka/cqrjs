"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.SubscriptionConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.SubscriptionConfigurators.HandlerSubscriptionConfigurator = (function () {

        var handlerField = System.ComponentModel.PrivateName();
        var messageNameField = System.ComponentModel.PrivateName();
        var referenceFactoryField = System.ComponentModel.PrivateName();

        function HandlerSubscriptionConfigurator(messagename, handler) {
            this[messageNameField] = messagename;
            this[handlerField] = function(context) {
                var c = function (x) {
                    //x.createScope(function () {
                        var r = handler(x.message);
                        return r;
                   // });
                };
                c.consumerType = 'function<' + messagename + '>';
                return c;
            };
            this[handlerField].getMessageType = function () { return messagename;};
            this[referenceFactoryField] = permanent();
        }

        HandlerSubscriptionConfigurator.prototype.configure = function () {
            return new ServiceBus.SubscriptionBuilders.HandlerSubscriptionBuilder(this[messageNameField], this[handlerField], this[referenceFactoryField]);
        };

        HandlerSubscriptionConfigurator.prototype.validate = function () {
            var validationResults = [];
            if (!this[handlerField] && !_(this[handlerField]).isFunction()) {
                validationResults.push(failure(null, 'The handler cannot be null. This should have come from the ctor.'));
            }

            if (!this[messageNameField] && !_(this[messageNameField]).isString()) {
                validationResults.push(failure(null, 'The message cannot be null. This should have come from the ctor.'));
            }

            return validationResults;
        };

        function failure (key, msg) {
            return new ServiceBus.Configurators.ValidationResult(ServiceBus.Configurators.ValidationResultDescription.Failure, key, null, msg);
        }

        function permanent() {
            return function(unsubscribe) {
                return new PermanentSubscriptionReference(unsubscribe);
            };
        }

        var PermanentSubscriptionReference = (function () {
            var ctor = function (unsubscribe) {}
            ctor.prototype.onStop = function () {};
            return ctor;
        }());

        return HandlerSubscriptionConfigurator;
    }());
});