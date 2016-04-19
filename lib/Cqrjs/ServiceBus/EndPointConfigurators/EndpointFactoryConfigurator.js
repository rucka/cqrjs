"use strict";
define(['../../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus.EndpointConfigurators");
    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.EndpointConfigurators.EndpointFactoryConfigurator = (function () {
        var defaultSettingsField = System.ComponentModel.PrivateName();
        var endpointFactoryBuilderFactoryField = System.ComponentModel.PrivateName();
        var endpointFactoryConfiguratorsField  = System.ComponentModel.PrivateName();

        function EndpointFactoryConfigurator(defaultSettings) {
            this[defaultSettingsField] = defaultSettings;
            this[endpointFactoryBuilderFactoryField] = function (defaults) {
                return new ServiceBus.Builders.EndpointFactoryBuilder(defaults);
            };
            this[endpointFactoryConfiguratorsField] = [];

            Object.defineProperty(this, 'defaults', {
                enumerable: true,
                writable: false,
                value: _(defaultSettings).clone()
            });
        }

        EndpointFactoryConfigurator.prototype.useEndpointFactoryBuilder = function (endpointFactoryBuilderFactory) {
            if (!endpointFactoryBuilderFactory || !_(endpointFactoryBuilderFactory).isFunction()) {
                throw new Error('endpointFactoryBuilder must be a function');
            }
            this[endpointFactoryBuilderFactoryField] = endpointFactoryBuilderFactory;
        };

        EndpointFactoryConfigurator.prototype.addEndpointFactoryConfigurator = function (configurator) {
            System.ComponentModel.Object.prototype.ensureHasMethods(configurator, 'configurator', ['configure', 'validate']);
            this[endpointFactoryConfiguratorsField].push(configurator);
        };

        EndpointFactoryConfigurator.prototype.createEndpointFactory = function () {
            var endpointFactoryBuilderFactory = this[endpointFactoryBuilderFactoryField];
            var defaultSettings = this[defaultSettingsField];
            var builder = endpointFactoryBuilderFactory(defaultSettings);
            ServiceBus.Builders.EndpointFactoryBuilder.ensureIsEndpointFactoryBuilder(builder);

            var endpointFactoryConfigurators = this[endpointFactoryConfiguratorsField];
            _(endpointFactoryConfigurators).each (function (configurator) {
                builder = configurator.configure(builder);
            });

            return builder.build();
        };

        EndpointFactoryConfigurator.prototype.validate = function () {
            var validationResults = [];

            if (!this[endpointFactoryBuilderFactoryField]) {
                validationResults.push(failure('builderFactory', "The builder factory was null. Since this came from a 'Default' this is spooky."));
            }

            _(this[endpointFactoryConfiguratorsField]).each(function (c) {
                _(c.validate()).each(function (e) {
                    e.key = 'endpointFactory.' + e.key;
                    validationResults.push(e);
                });
            });

            return validationResults;
        };

        function failure (key, msg) {
            return new ServiceBus.Configurators.ValidationResult(ServiceBus.Configurators.ValidationResultDescription.Failure, key, null, msg);
        }

        return EndpointFactoryConfigurator;
    }());
});