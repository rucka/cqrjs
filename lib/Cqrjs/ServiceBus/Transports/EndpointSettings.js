"use strict";
define(['../../../root', '../../../extends', 'mdcore', 'underscore'], function (Cqrjs, __extends, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.EndpointSettings = (function (_super) {
        __extends(EndpointSettings, _super);
        function EndpointSettings(uri, endpointSettings) {
            var endpointAddress;
            if (ServiceBus.Uri.isUri(uri) || ServiceBus.Uri.isUrl(uri)) {
                endpointAddress = ServiceBus.Uri.isUri(uri) ? new ServiceBus.EndpointAddress(uri) : new ServiceBus.EndpointAddress(new ServiceBus.Uri(uri));
            } else {
                endpointAddress = uri;
            }
            ServiceBus.EndpointAddress.ensureIsEndpointAddress(endpointAddress);

            if (endpointSettings) {
                this.serializer = source.serializer;
                if (endpointSettings.errorAddress != address) {
                    this.errorAddress = endpointSettings.errorAddress;
                }
                this.retryLimit = endpointSettings.retryLimit;
                this.trackerFactory = endpointSettings.trackerFactory;
            } else {
                var errorUri = new ServiceBus.Uri(endpointAddress.uri.toString() + '_error');
                this.errorAddress = new ServiceBus.EndpointAddress(errorUri);
            }

            _super.call(this, endpointAddress, endpointSettings);


        }

        EndpointSettings.ensureIsEndpointSettings = function (instance) {
            ServiceBus.Transports.TransportSettings.ensureIsTransportSettings(instance);
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'EndpointSettings', ['errorAddress', 'retryLimit']);
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'EndpointSettings', ['trackerFactory']);
            if (_(instance.serializer).isUndefined()) {
                throw new Error('Expected method "serializer" not found for EndpointSettings');
            }
        };

        return EndpointSettings;
    }(ServiceBus.Transports.TransportSettings));
});