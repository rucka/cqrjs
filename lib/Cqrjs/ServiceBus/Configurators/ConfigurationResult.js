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

    Cqrjs.ServiceBus.Configurators.ConfigurationResult = (function () {
        function ConfigurationResult(results) {
            if (!results || !_(results).isArray()) {
                throw new Error('Expected results provided as array');
            }

            _(results).each(function (r) {
                System.ComponentModel.Object.prototype.ensureHasProperties(r, 'ConfigurationResult', ['disposition', 'key', 'value', 'message']);
                System.ComponentModel.Object.prototype.ensureHasMethods(r, 'ConfigurationResult', ['toString']);
            });

            Object.defineProperty(this, 'results', {
                enumerable: true,
                writable: false,
                value: _(results).clone()
            });
        }

        ConfigurationResult.prototype.containsFailure = function () {
            return _(this.results).some(function (r) {
                return r.disposition === Cqrjs.ServiceBus.Configurators.ValidationResultDescription.Failure;
            });
        }

        ConfigurationResult.CompileResults = function (results) {
            var result = new ConfigurationResult(results);
            if (result.containsFailure()) {
                var message = "The service bus was not properly configured:\r\n" + _(results).map(function(r){return r.toString()}).join('\r\n');
                throw new Error(message);
            }
            return result;
        };
        return ConfigurationResult;
    }());
});