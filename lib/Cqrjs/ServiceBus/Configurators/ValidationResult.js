"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Configurators");

    Cqrjs.ServiceBus.Configurators.ValidationResultDescription = (function(){
        return {
            Failure: 'Failure',
            Success: 'Success',
            Warning: 'Warning'
        };
    }());

    Cqrjs.ServiceBus.Configurators.ValidationResult = (function () {
        function ValidationResult(disposition, key, value, message) {

            if (!_(Cqrjs.ServiceBus.Configurators.ValidationResultDescription).has(disposition)) {
                throw new Error ('Invalid disposition value');
            }

            Object.defineProperty(this, 'disposition', {
                enumerable: true,
                writable: false,
                value: disposition
            });

            Object.defineProperty(this, 'key', {
                enumerable: true,
                writable: false,
                value: key || ''
            });

            Object.defineProperty(this, 'message', {
                enumerable: true,
                writable: false,
                value: message
            });

            Object.defineProperty(this, 'value', {
                enumerable: true,
                writable: false,
                value: value
            });
        }

        ValidationResult.prototype.toString = function () {
            return "[{0}] {1}".
                replace('{0}', this.disposition).
                replace('{1}', _(this.key).isNull() || _(this.key).isEmpty() ? this.message : this.key + ' ' + this.message);
        };

        return ValidationResult;
    }());
});