"use strict";
define(['../../root', 'mdcore', 'underscore', 'Q'], function (Cqrjs, System, _, Q) {
    Cqrjs.namespace("Cqrjs.ServiceBus");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.ServiceBus = (function () {

        var controlBusField = System.ComponentModel.PrivateName();
        var isStartedField = System.ComponentModel.PrivateName();
        var receiveTimeoutField = System.ComponentModel.PrivateName();
        var serviceContainerField = System.ComponentModel.PrivateName();
        var consumerPoolField = System.ComponentModel.PrivateName();
        var endpointField = System.ComponentModel.PrivateName();
        var endpointCacheField = System.ComponentModel.PrivateName();
        var eventChannelField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function ctor (endpointToListenOn, endpointCache) {
            ServiceBus.Transports.Endpoint.ensureIsEndpoint(endpointToListenOn);
            ServiceBus.Transports.EndpointCache.ensureIsEndpointCache(endpointCache);

            this[disposedField] = false;
            this[isStartedField] = false;
            var that = this;

            this[endpointField] = endpointToListenOn;
            this[endpointCacheField] = endpointCache;
            this[eventChannelField] = new ServiceBus.Channels.ChannelAdapter();

            Object.defineProperty(this, 'eventChannel', {
                enumerable: true,
                get : function() {return this[eventChannelField];}
            });

            Object.defineProperty(this, 'endpoint', {
                enumerable: true,
                get : function() {return this[endpointField];}
            });

            Object.defineProperty(this, 'endpointCache', {
                enumerable: true,
                get : function() {return this[endpointCacheField];}
            });

            var inboundPipeline = {};
            Object.defineProperty(this, 'inboundPipeline', {
                enumerable: true,
                get : function(){return inboundPipeline;}
            });

            var outboundPipeline = {};
            Object.defineProperty(this, 'outboundPipeline', {
                enumerable: true,
                get : function(){return outboundPipeline;}
            });

            this[controlBusField] = this;
            Object.defineProperty(this, 'controlBus', {
                enumerable: true,
                get : function(){return this[controlBusField];},
                set : function(value) {
                    ctor.ensureIsServiceBus(value);
                    that[controlBusField] = value;
                }
            });

            this[receiveTimeoutField] = 3000;
            Object.defineProperty(this, 'receiveTimeout', {
                enumerable: true,
                get : function(){return this[receiveTimeoutField];},
                set : function(value) {
                    if (that[isStartedField]) {
                        var error = new Error('The receive timeout cannot be changed once the bus is in motion. Beep! Beep!');
                        error.getType = function() {return 'ConfigurationError';};
                    }
                    that[receiveTimeoutField] = value;
                }
            });

            outboundPipeline = new ServiceBus.Pipeline.Configuration.OutboundMessagePipelineConfigurator(this).pipeline;
            inboundPipeline = ServiceBus.Pipeline.Configuration.InboundMessagePipelineConfigurator.createDefault(this);
            this[serviceContainerField] = new ServiceBus.ServiceContainer(this);

            Object.defineProperty(this, 'disposed', {
                enumerable: true,
                get : function(){return this[disposedField];}
            });
        }

        ctor.prototype.publish = function (messagetype, message, contextCallback) {
            if (_(message).isFunction()) {
                contextCallback = message;
                message = undefined;
            }

            if (_(message).isUndefined() && !_(message).isFunction()){
                message = messagetype;
                messagetype = message.getMessageType ? message.getMessageType() : undefined;
            }


            if (_(message).isFunction() && _(contextCallback).isUndefined()) {
                contextCallback = message;
                message = undefined;
            }

            if (_(contextCallback).isUndefined()) {
                contextCallback = function() {};
            }

            if (!_(contextCallback).isFunction()) {
                throw new Error('expected context callback as function');
            }

            var context = new ServiceBus.Context.PublishContext(messagetype, message);
            context.setSourceAddress(this.endpoint.address.uri);
            contextCallback(context);

            var errors = [];
            var publishedCount = 0;

            var that = this;

            var consumers = this.outboundPipeline.enumerate(context);

            var promises = _(consumers).
                map(function (consumer) {
                    return Q.fcall(function () {
                        return consumer(context);
                    }).
                    then(function () {
                        that[publishedCount]++;
                    }).
                    fail (function (ce) {
                        var consumerName = consumer.getType ? consumer.getType() : 'consumer';
                        logerror("'{0}' threw an exception publishing message '{1}'".
                            replace('{0}', consumerName).
                            replace('{1}', messagetype)
                        );
                        errors.push(ce);
                    });
                });

            return Q.allResolved(promises).
                then(function () {
                    context.complete();

                    that.eventChannel.send({
                        messageType : messagetype,
                        consumerCount : publishedCount,
                        duration : context.duration,
                        getMessageType: function () {return 'MessagePublished';}
                    });

                    if (errors.length > 0){
                        var error = new Error("At least one error occurred publishing to {0}".
                            replace('{0}', messagetype));
                        error.errors = errors;
                        error.getType = function () {return 'PublishError';};
                        throw error;
                    }
                });
        };

        ctor.prototype.getEndpoint = function (address) {
            ServiceBus.Uri.ensureIsUri(address);
            return this.endpointCache.getEndpoint(address);
        };

        ctor.prototype.configure = function (configure) {
            return this.inboundPipeline.configure(configure);
        };

        ctor.prototype.getService = function (serviceType) {
            return this[serviceContainerField].getService(serviceType);
        };

        ctor.prototype.addService = function (layer, service) {
            this[serviceContainerField].addService(layer, service);
        };

        ctor.prototype.start = function () {
            if (this[isStartedField]) {return;}

            var consumerPool;
            var serviceContainer = this[serviceContainerField];
            try {
                serviceContainer.start();
                consumerPool = new ServiceBus.Threading.ConsumerPool(this, this.eventChannel, this.receiveTimeout);
                consumerPool.start();
            } catch (e) {
                if (consumerPool) {
                    consumerPool.dispose();
                }
                throw e;
            }
            this[consumerPoolField] = consumerPool;
            this[isStartedField] = true;
        };

        ctor.prototype.dispose = function () {
            if (this[disposedField]) {
                return;
            }

            var consumerPool = this[consumerPoolField];
            var serviceContainer = this[serviceContainerField];

            if (!_(consumerPool).isUndefined()) {
                consumerPool.stop();
                consumerPool.dispose();
                this[consumerPoolField] = undefined;
            }

            if (!_(serviceContainer).isUndefined()) {
                serviceContainer.stop();
                serviceContainer.dispose();
                this[serviceContainerField] = undefined;
            }

            if (this.controlBus !== this) {this.controlBus.dispose();}

            this[eventChannelField] = undefined;
            this[endpointField].dispose();
            this[endpointField] = undefined;
            this[endpointCacheField].dispose();
            this[disposedField] = true;
        };

        ctor.ensureIsServiceBus = function (instance) {
            System.ComponentModel.Object.prototype.ensureHasProperties(instance, 'ServiceBus', ['inboundPipeline', 'outboundPipeline', 'endpoint', 'controlBus', 'endpointCache']);
            System.ComponentModel.Object.prototype.ensureHasMethods(instance, 'ServiceBus', ['publish', 'getEndpoint', 'configure', 'getService']);
        };

        function log (message, level, category, metadata) {
            System.ComponentModel.logger.log(message, level, serviceName, category, metadata);
        }

        function logdebug (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'debug', serviceName, category, metadata);
        }

        function logverbose (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'verbose', serviceName, category, metadata);
        }

        function logwarn (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'warn', serviceName, category, metadata);
        }

        function logerror (message, category, metadata) {
            System.ComponentModel.logger.log(message, 'err', serviceName, category, metadata);
        }

        return ctor;
    }());
});