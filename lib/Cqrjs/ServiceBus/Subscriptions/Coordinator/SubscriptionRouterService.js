"use strict";
define(['../../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Subscriptions.Coordinator");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Subscriptions.Coordinator.SubscriptionRouterService = (function () {

        var busField = System.ComponentModel.PrivateName();
        var listenersField = System.ComponentModel.PrivateName();
        var observersField = System.ComponentModel.PrivateName();
        var unregisterField = System.ComponentModel.PrivateName();
        var unsubscribersField = System.ComponentModel.PrivateName();
        var disposedField = System.ComponentModel.PrivateName();

        function SubscriptionRouterService(bus, network) {
            var that = this;
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);

            this[disposedField] = false;

            this[busField] = bus;
            Object.defineProperty(this, 'network', {
                enumerable: false,
                writable: false,
                value: network
            });

            var peerId = System.ComponentModel.Guid.NewGuid().asString();
            Object.defineProperty(this, 'peerId', {
                enumerable: false,
                writable: false,
                value: peerId
            });

            this[listenersField] = [];
            this[observersField] = [];
            this[unsubscribersField] = [];
            this[unregisterField] = function(){
                _(that[unsubscribersField]).each(function (u) {
                    if (!u()) {return false;}
                    return true;
                });
            };
        }

        SubscriptionRouterService.prototype.addObserver = function (observer) {
            ServiceBus.Subscriptions.Coordinator.SubscriptionObserver.ensureIsSubscriptionObserver(observer);
            this[observersField].push(observer);
        };

        SubscriptionRouterService.prototype.onSubscriptionAdded = function(message) {
            _(this[observersField]).each(function(observer) {
                observer.onSubscriptionAdded(message);
            });
        };

        SubscriptionRouterService.prototype.onSubscriptionRemoved = function(message) {
            _(this[observersField]).each(function(observer) {
                observer.onSubscriptionRemoved(message);
            });
        };

        SubscriptionRouterService.prototype.onComplete = function() {
        };

        SubscriptionRouterService.prototype.start = function (bus) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);

            var subscriptionEventListener = new BusSubscriptionEventListener(bus, this);

            var unsubscribe = bus.configure(function(x){
                var unregisterAction = x.register(subscriptionEventListener);
                return function() { return unregisterAction();};
            });

            this[unsubscribersField].push(unsubscribe);
            this[listenersField].push(subscriptionEventListener);

            var controlBus = bus.controlBus;
            if (controlBus !== bus) {
                this.start(controlBus);
            }
        };

        SubscriptionRouterService.prototype.stop = function () {
            this[unregisterField]();
        };

        SubscriptionRouterService.prototype.getType = function () {return 'SubscriptionRouterService';};

        SubscriptionRouterService.prototype.send = function(message) {
            throw new Error('send not yet implemented');
        };

        SubscriptionRouterService.prototype.dispose = function() {
            if (this[disposedField]) {
                return;
            }

            _(this[observersField]).each(function (o) {
                o.onComplete();
            });

            //_peerCache.Send<StopSubscriptionRouterService>();
            //_peerCache.SendRequestWaitForResponse<Exit>(new ExitImpl(), 30.Seconds());

            //_repository.Dispose();

            this[disposedField] = true;
        };

        return SubscriptionRouterService;
    }());

    var BusSubscriptionEventListener = (function () {
        var serviceName = 'BusSubscriptionEventListener';
        var busField = System.ComponentModel.PrivateName();
        var endpointUriField = System.ComponentModel.PrivateName();
        var busSubscriptionCacheField = System.ComponentModel.PrivateName();

        function BusSubscriptionEventListener(bus, observer) {
            ServiceBus.ServiceBus.ensureIsServiceBus(bus);
            this[busField] = bus;
            this[busSubscriptionCacheField] = new BusSubscriptionCache(observer);
            this[endpointUriField] = bus.endpoint.address.uri;

            Object.defineProperty(this, 'subscribers', {
                enumerable: false,
                get: function() {return this[busSubscriptionCacheField].subscriptions;}
            });
        }

        BusSubscriptionEventListener.prototype.subscribedTo = function (messageType, correlationId) {
            var that = this;
            var subscriptionId = System.ComponentModel.Guid.NewGuid().asString();
            var messageName = messageType;

            var subscribeTo = {
                getMessageType: function () {return 'SubscribeToMessage';},
                subscriptionId : subscriptionId,
                    endpointUri : that[endpointUriField],
                    messageName : messageName,
                    correlationId : correlationId
            };

            logdebug("SubscribeTo: " + subscribeTo.messageName + ", " + subscribeTo.subscriptionId);
            this[busSubscriptionCacheField].onSubscribeTo(subscribeTo);

            return function() { return that.unsubscribe(subscriptionId, messageName, correlationId);};
        };

        BusSubscriptionEventListener.prototype.unsubscribe = function (subscriptionId, messageName, correlationId) {
            var unsubscribeFrom = {
                getMessageType: function () {return 'UnsubscribeFromMessage';},
                subscriptionId : subscriptionId,
                messageName : messageName,
                correlationId : correlationId
            };

            logdebug("UnsubscribeFrom: " + unsubscribeFrom.messageName + ", " + unsubscribeFrom.subscriptionId);
            this[busSubscriptionCacheField].onUnsubscribeFrom(unsubscribeFrom);
            return true;
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

        return BusSubscriptionEventListener;
    }());

    var BusSubscriptionCache = (function () {
        var serviceName = 'BusSubscriptionCache';
        var cacheField = System.ComponentModel.PrivateName();
        var observerField = System.ComponentModel.PrivateName();

        function BusSubscriptionCache(observer) {
            this[observerField] = observer;
            this[cacheField] = {};

            Object.defineProperty(this, 'subscribers', {
                enumerable: false,
                get: function() {
                    return _.chain(this[cacheField]).
                        map(function(s){return s.subscriptions;}).
                        flatten().
                        value;
                }
            });
        }

        BusSubscriptionCache.prototype.onSubscribeTo = function (message) {
            /*var key = {
                messageName : message.messageName,
                correlationId: message.correlationId
            };*/
            var key = message.messageName + '_$$_' + message.correlationId;

            var cache = this[cacheField];
            if (_(cache[key]).isUndefined()) {
                cache[key] = new BusSubscription(message.messageName, message.correlationId, this[observerField]);
            }
            var subscription = cache[key];

            logdebug("SubscribeFrom: " + message.messageName + ", " + message.subscriptionId);
            subscription.onSubscribeTo(message);
        };

        BusSubscriptionCache.prototype.onUnsubscribeFrom = function (message) {
            /*var key = {
             messageName : message.messageName,
             correlationId: message.correlationId
             };*/
            var key = message.messageName + '_$$_' + message.correlationId;

            var cache = this[cacheField];
            var subscription = cache[key];
            cache[key] = undefined;
            logdebug("UnsubscribeFrom: " + message.messageName + ", " + message.subscriptionId);
            subscription.onUnsubscribeFrom(message);
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

        return BusSubscriptionCache;
    }());

    var BusSubscription = (function () {
        var serviceName = 'BusSubscription';
        var messageNameField = System.ComponentModel.PrivateName();
        var correlationIdField = System.ComponentModel.PrivateName();
        var observerField = System.ComponentModel.PrivateName();

        var idsField = System.ComponentModel.PrivateName();
        var subscriptionIdField = System.ComponentModel.PrivateName();
        var endpointUriField = System.ComponentModel.PrivateName();

        function BusSubscription(messageName, correlationId, observer) {
            this[messageNameField] = messageName;
            this[correlationIdField] = correlationId;
            this[observerField] = observer;

            this[idsField] = {};
            this[subscriptionIdField] = '';
        }

        BusSubscription.prototype.onSubscribeTo = function (added) {
            var ids = this[idsField];
            var wasAdded = _(ids[added.subscriptionId]).isUndefined();
            ids[added.subscriptionId] = added.subscriptionId;

            var count = _.reduce(ids, function(c){ return c+1; }, 0);
            if (!wasAdded || count !== 1) {return;}

            this[subscriptionIdField] = System.ComponentModel.Guid.NewGuid().asString();
            this[endpointUriField] = added.endpointUri;

            var add = {
                getMessageType : function() {return 'SubscriptionAddedMessage';},
                subscriptionId : this[subscriptionIdField],
                endpointUri : this[endpointUriField],
                messageName : this[messageNameField],
                correlationId : this[correlationIdField]
            };

            logdebug("SubscribeTo: " + add.messageName + ", " + add.subscriptionId);
            this[observerField].onSubscriptionAdded(add);
        };

        BusSubscription.prototype.onUnsubscribeFrom = function (removed) {
            var ids = this[idsField];
            if (!_(ids[removed.subscriptionId]).isUndefined()) {return;}

            this[idsField] = {};

            var remove = {
                getMessageType : 'SubscriptionRemovedMessage',
                subscriptionId : this[subscriptionIdField],
                endpointUri : this[endpointUriField],
                messageName : this[messageNameField],
                correlationId : this[correlationIdField]
            };

            logdebug("UnsubscribeFrom: " + remove.messageName + ", " + remove.subscriptionId);

            this[observerField].onSubscriptionRemoved(remove);
            this[subscriptionIdField] = '';
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

        return BusSubscription;
    }());
});