"use strict";
define(['../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Threading");
    var ServiceBus = Cqrjs.ServiceBus;

    Cqrjs.ServiceBus.Threading.ConsumerPool = (function () {
        var serviceName = 'ConsumerPool';

        var busField = System.ComponentModel.PrivateName();
        var enabledField = System.ComponentModel.PrivateName();
        var eventChannelField = System.ComponentModel.PrivateName();
        var eventConnectionField = System.ComponentModel.PrivateName();
        var receiveTimeoutField = System.ComponentModel.PrivateName();
        var receiverCountField = System.ComponentModel.PrivateName();
        var consumerCountField = System.ComponentModel.PrivateName();
        var maximumConsumerCountField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        var ConsumerPool = function (bus, eventChannel, receiveTimeout) {
            var that = this;

            this[disposedField] = false;
            this[busField] = bus;
            this[eventChannelField] = eventChannel;
            this[receiveTimeoutField] = receiveTimeout;
            this[eventConnectionField] = undefined;
            this[enabledField] = false;
            this[receiverCountField] = 0;
            this[consumerCountField ] = 0;
            this[maximumConsumerCountField] = 25;

            Object.defineProperty(this, 'maximumConsumerCount', {
                enumerable: false,
                get: function () {return that[maximumConsumerCountField];},
                set: function (value) {
                    if (_(value).isNaN()) {throw new Error('Invalid value. Expected a number');}
                    if (value < 0) {throw new Error('The maximum consumer count must be at least one');}
                    that[maximumConsumerCountField] = value;
                }
            });
        };

        ConsumerPool.prototype.start = function () {
            var eventChannel = this[eventChannelField];
            var bus = this[busField];
            var that = this;

            this[eventConnectionField] = eventChannel.connect(function (x) {
                x.addConsumer('ReceiveCompleted', function () {
                    that[receiverCountField]--;
                    _(queueReceiver).bind(that)();
                });
                x.addConsumer('ConsumeCompleted', function () {
                    that[consumerCountField]--;
                    _(queueReceiver).bind(that)();
                });
            });

            logdebug("Starting Consumer Pool for " + bus.endpoint.address.uri.toString());
            this[enabledField] = true;
            _(queueReceiver).bind(that)();
        };

        var queueReceiver = function () {
            if (this[enabledField] === false) {return;}
            if (this[receiverCountField] > 0) {return;}
            if (this[consumerCountField] >= this[maximumConsumerCountField]) {return;}

            var bus = this[busField];
            var eventChannel = this[eventChannelField];
            var receiveTimeout = this[receiveTimeoutField];

            var context = new ServiceBus.Context.ServiceBusReceiveContext(bus, eventChannel, receiveTimeout);
            context.receiverIndex = this[receiverCountField];
            context.consumerIndex = this[consumerCountField];

            this[receiverCountField]++;
            this[consumerCountField]++;

            try {
                process.nextTick(function () {
                    log('[ri '+ context.receiverIndex + ', ci '+ context.consumerIndex + '] receiveFromEndpoint called: ' + new Date());
                    context.receiveFromEndpoint();
                });
            } catch (e) {
                logerror('Unable to queue consumer to consumer pool. Error message: ' + e.message);
                this[receiverCountField]--;
                this[consumerCountField]--;
            }

            eventChannel.send({
                receiverCount : this[receiverCountField],
                consumerCount : this[consumerCountField],
                getMessageType : function() {return 'ReceiverQueued';}
            });
        };

        ConsumerPool.prototype.stop = function () {
            var that = this;
            var bus = this[busField];

            this[enabledField] = false;
            var endpointAddressString = bus.endpoint.address.uri.toString();
            logdebug("Stopping Consumer Pool for " + endpointAddressString);

            if (this[consumerCountField] === 0) {return;}

            try {
                var connection = this[eventChannelField].connect(function (x) {
                    x.addConsumer('ConsumeCompleted', function () {
                        logdebug("Consumer stopped for " + endpointAddressString);
                    });
                });
            } catch(e) {
                connection.dispose();
                connection = undefined;
            }

            var startTime = process.hrtime();
            var checkTimeout = function () {
                if (that[consumerCountField] === 0) {
                    if (!_(connection).isUndefined()) {connection.dispose(); connection = undefined; }
                    return;
                }

                var elapsed = process.hrtime(startTime);
                if (getTotMilliseconds(elapsed) >= 60000) {
                    logdebug("Timeout stopping Consumer Pool for " + endpointAddressString);
                    if (!_(connection).isUndefined()) {connection.dispose(); connection = undefined; }
                    return;
                }
                process.nextTick(checkTimeout);
            };
            process.nextTick(checkTimeout);
        };

        ConsumerPool.prototype.dispose = function () {
            if (this[disposedField]) {return;}

            if (_(this[eventConnectionField]).isUndefined()) {
                this[eventConnectionField].dispose();
                this[eventConnectionField] = undefined;
            }

            this[disposedField] = true;
        };

        function getTotMilliseconds(hrtime) {
            var nanoSec = hrtime[0] * 1e9 + hrtime[1];
            return nanoSec / 1e6;
        }

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

        return ConsumerPool;
    }());
});