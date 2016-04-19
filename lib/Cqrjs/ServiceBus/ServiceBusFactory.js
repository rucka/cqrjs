"use strict";
define(['../../root', 'mdcore', 'underscore', 'q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus");

    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.ServiceBusFactory = (function(){
        return {
            New : function (configure) {
                if (!configure || !_(configure).isFunction()) {
                    throw new Error ('configure must be provided as function');
                }
                var configurator = new ServiceBus.BusConfigurators.ServiceBusConfigurator(defaultSettings());
                //configurator.enableMessageTracing(); //TODO: to be implemented

                configure(configurator);

                var result = ServiceBus.Configurators.ConfigurationResult.CompileResults(configurator.validate());

                try
                {
                    return configurator.createServiceBus();
                }
                catch (e) {
                    var error = new Error("An error was thrown during service bus creation");
                    error.result = result;
                    error.innerError = e;
                    throw error;
                }
            }
        };

        function defaultSettings() {
            return new ServiceBus.BusConfigurators.ServiceBusDefaultSettings();
        }
    }());
});