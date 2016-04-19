"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Builders");

    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.Builders.EndpointBuilder = (function () {
        var uriField = System.ComponentModel.PrivateName();
        var settingsField = System.ComponentModel.PrivateName();
        var errorSettingsField = System.ComponentModel.PrivateName();
        var transportFactoryField = System.ComponentModel.PrivateName();
        var errorTransportFactoryField = System.ComponentModel.PrivateName();
        var messageTrackerFactoryField = System.ComponentModel.PrivateName();

        function EndpointBuilder(uri, settings, errorSettings, transportFactory, errorTransportFactory,  messageTrackerFactory) {
            ServiceBus.Uri.ensureIsUri(uri);
            ServiceBus.Transports.EndpointSettings.ensureIsEndpointSettings(settings);
            ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(errorSettings);

            if (!_(transportFactory).isFunction()) {
                throw Error('expected function as transportFactory');
            }

            if (!_(errorTransportFactory).isFunction()) {
                throw Error('expected function as errorTransportFactory');
            }

            if (!_(messageTrackerFactory).isFunction()) {
                throw Error('expected function as messageTrackerFactory');
            }

            this[uriField] = uri;
            this[settingsField] = settings;
            this[errorSettingsField] = errorSettings;
            this[transportFactoryField] = transportFactory;
            this[errorTransportFactoryField] = errorTransportFactory;
            this[messageTrackerFactoryField] = messageTrackerFactory;
        };

        EndpointBuilder.prototype.createEndpoint = function (transportFactory) {
            ServiceBus.Transports.TransportFactory.ensureIsTransportFactory(transportFactory);
            try
            {
                var settings = this[settingsField];

                var transport = this[transportFactoryField](transportFactory, settings);
                ServiceBus.Transports.DuplexTransport.ensureIsDuplexTransport(transport);

                var errorTransport = this[errorTransportFactoryField](transportFactory, this[errorSettingsField]);
                ServiceBus.Transports.OutboundTransport.ensureIsOutboundTransport(errorTransport);
                var tracker = this[messageTrackerFactoryField]();
                ServiceBus.Transports.InboundMessageTracker.ensureIsInboundMessageTracker(tracker);

                var endpoint = new ServiceBus.Transports.Endpoint(transport.address, settings.serializer, transport, errorTransport, tracker);

                return endpoint;
            }
            catch (e) {
                 var error = new Error('Failed to create endpoint to address: ' + uri.toString());
                error.innerError = e;
                error.getType = function () {return 'EndpointError';};
                throw error;
            }
        };

        return EndpointBuilder;
    }());
});


