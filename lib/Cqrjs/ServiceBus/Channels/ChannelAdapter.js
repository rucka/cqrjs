"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {

    Cqrjs.namespace("Cqrjs.ServiceBus.Channels");

    Cqrjs.ServiceBus.Channels.ChannelAdapter = (function () {
        var serviceName = 'ChannelAdapter';

        var outputField = System.ComponentModel.PrivateName();

        function ctor(){
            var that = this;
            this[outputField] = createShuntChannel();
            Object.defineProperty(this, 'output', {
                enumerable: false,
                get : function () {return that[outputField];}
            });
        }

        ctor.prototype.send = function (messagetype, message) {
            this[outputField].send(messagetype, message);
        };

        ctor.prototype.changeOutputChannel = function(mutator) {
            while (true) {
                var originalValue = this[outputField];
                var changedValue = mutator(originalValue);
                this[outputField] = changedValue;
                if (changedValue !== originalValue) {
                    return;
                }
            }
        };

        ctor.prototype.connect = function(subscriberAction) {
            var that = this;
            var disconnectChannels = function (channels) {
                logwarn('DisconnectChannelVisitor need to be implemented in order to complete dispose of ChannelAdapter');
                //new DisconnectChannelVisitor(channels).disconnectFrom(that);
            };

            var connection = new ChannelConnection(disconnectChannels);
            var that = this;

            var subscriber = {
                addConsumer : function (messageType, handler) {
                    var consumerChannel = new ConsumeChannel(messageType, handler);
                    var visitor = new ConnectChannelVisitor(consumerChannel);
                    visitor.connectTo(that);
                    connection.addChannel(consumerChannel);
                }
            };

            subscriberAction(subscriber);
            return connection;
        };

        var ConnectChannelVisitor = (function () {
            var ctor = function (newChannel) {
                this.added = false;
                this.newChannel = newChannel;
            };

            ctor.prototype.connectTo = function (channel) {
                this.visitChannelAdapter(channel);
                if (!this.added) {
                    throw new Error("The binding operation failed: " + channel.getChannelType());
                }
            };

            ctor.prototype.visitConsumerChannel = function (channel) {
                return channel;
            }

            ctor.prototype.visitChannelAdapter = function (channel) {
                var wasAdded = this.added;
                var that = this;

                channel.changeOutputChannel(function (original) {
                    that.added = wasAdded;

                    var methodName = 'visit' + original.getChannelType();
                    var replacement = that[methodName](original);

                    if (!that.added) {
                        if (replacement.getChannelType() == 'ShuntChannel') {
                            replacement = createBroadcastChannel([getUntypedChannel.call(that)]);
                            that.added = true;
                        }
                    }

                    return replacement;
                });

                return channel;
            };

            ctor.prototype.visitShuntChannel = function (channel) {
                return channel;
            };

            ctor.prototype.visitBroadcastChannel = function (channel) {
                var results = [];
                var changed = false;
                var that = this;

                _(channel.listeners).each(function (subscriber) {
                    var methodName = 'visit' + subscriber.getChannelType();
                    var newSubscriber = that[methodName](subscriber);

                    if (_(newSubscriber).isUndefined() || newSubscriber !== subscriber) {
                        changed = true;
                        if (_(newSubscriber).isUndefined()) {
                            return;
                        }
                    }
                    results.push(newSubscriber);
                });

                if (!that.added) {
                    that.added = true;
                    results.push(getUntypedChannel.call(that));
                    changed = true;
                }

                if(changed) {
                    return createBroadcastChannel(results);
                }
                return channel;
            };

            ctor.prototype.visitTypedChannelAdapter = function (channel) {
               var original = channel.output;

                var methodName = 'visit' + original.getChannelType();
                var replacement = this[methodName](original);

                if (!this.added && channel.getChannelType() === this.newChannel.getChannelType())
                {
                    replacement = createBroadcastChannel([replacement, this.newChannel/*GetChannel<T>()*/]);
                    this.added = true;
                }

                if (original !== replacement) {
                    return createTypedChannelAdapter(replacement);
                }

                return channel;
            };

            function getUntypedChannel () {
                return createTypedChannelAdapter(this.newChannel);
            }

            return ctor;
        }());


        function createTypedChannelAdapter (output) {
            return {
                getChannelType : function() {return 'TypedChannelAdapter';},
                output: output,
                outputType: output.getMessageType(),
                send: function (message) {
                    output.send(message);
                    //		HeaderTypeAdapter<TOutput>.TryConvert(message, x => _output.Send(x));
                }

            };
        }

        function createShuntChannel () {
            return {
                getChannelType : function() {return 'ShuntChannel';},
                send: function(messagetype, message) {}
            };
        }
        function createBroadcastChannel (subscribers) {
            var listeners = [];
            _(subscribers).each(function(s){listeners.push(s);});
            var bc = {
                getChannelType : function() {return 'BroadcastChannel';},
                send : function (message) {
                    _.chain(subscribers).
                        filter(function (s) {
                            return s.outputType === message.getMessageType();
                        }).
                        each(function(s){
                            s.send(message);
                    });
                }
            };
            Object.defineProperty(bc, 'listeners', {
                enumerable: false,
                get : function (){return _(listeners).clone();}
            })

            return bc;
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

        return ctor;
    }());

    var ChannelConnection = (function () {
        function ctor (disconnect) {
            if (!_(disconnect).isFunction()) {
                throw new Error('Expected a function as disconnect parameter');
            }
            this.disposed = false;

            this.disconnect = disconnect;
            this.connectedChannels = [];
            this.disposable = [];
        }

        ctor.prototype.addChannel = function (channel) {
            this.connectedChannels.push(channel);
        };

        ctor.prototype.disconnect = function () {
            if (this.connectedChannels.length === 0) {return;}

            this.disconnect(this.connectedChannels);
            this.connectedChannels = [];
        };

        ctor.prototype.addDisposable = function (disposable) {
            this.disposable.push(disposable);
        };

        ctor.prototype.dispose = function () {
            if (this.disposed) {return;}
            this.disconnect();

            _(this.disposable).each (function (d) {
                try { d.dispose(); } catch(e) {}
            });
            this.disposable = [];
            this.disposed = true;
        };

        return ctor;
    }());

    var ConsumeChannel = (function () {
        var messageTypeField = System.ComponentModel.PrivateName();
        var consumerField = System.ComponentModel.PrivateName();

        function ctor(messageType, consumer) {
            this[messageTypeField] = messageType;
            this[consumerField] = consumer;
        }

        ctor.prototype.send = function (message) {
            this[consumerField](message);
        };

        ctor.prototype.getMessageType = function () {
            return this[messageTypeField];
        };

        ctor.prototype.getChannelType = function() {return 'ConsumerChannel';};

        return ctor;
    }());
});