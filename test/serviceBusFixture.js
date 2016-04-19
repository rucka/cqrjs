var ServiceBus = require('../main.js').ServiceBus;
var System = require('mdcore');
var Mongodb = require('mongodb');
var _ = require('underscore');
var Q = require('q');

this.ServiceBusModule = (function () {
    "use strict";

    //System.ComponentModel.logger.filterLevels = ['info', 'warn', 'err'];

    var connectionFactoryInMemory = function (serverip, port, dbname) {
        var server = new System.Data.Mongo.MongoDbInMemory.Server(serverip, port, {});
        var db = new System.Data.Mongo.MongoDbInMemory.Db(dbname, server);
        return db;
    };

    var connectionFactoryDb = function (serverip, port, dbname) {
        var server = new Mongodb.Server(serverip, port, {});
        var db = new Mongodb.Db(dbname, server, {safe : true});
        return db;
    };

    //var connectionFactory = connectionFactoryInMemory;
    var connectionFactory = connectionFactoryDb;

    return {
        setUp : function (callback) {
            if (callback) {
                callback();
            }
        },/*
        "register handler by message name" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        test.ok(msg.text === 'hi');
                        done();
                    });
                });
            });

            bus.publish('yourmessage', {text: 'hi'});
            _(done).delay(1000);
        },
        "publish message async" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);

            var deferred = Q.defer();

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        _(function () {
                            try {
                                test.ok(msg.text === 'hi');
                                done();
                                deferred.resolve();
                            } catch (ex) {
                                deferred.reject(ex);
                            }
                        }).delay(500);

                        return deferred.promise;
                    });
                });
            });

            bus.publish('yourmessage', {text: 'hi'});
            _(done).delay(2000);
        },
        "publish different sequence messages types to the bus" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(2);

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('message1', function (msg) {
                        test.ok(msg.text === 'im first message');
                        bus.publish('message2', {text: 'im second message'});
                    });
                    subs.handler('message2', function (msg) {
                        test.ok(msg.text === 'im second message');
                        done();
                    });
                });
            });

            bus.publish('message1', {text: 'im first message'});
            _(done).delay(1000);
        },
        "publish same message type more than one time to the bus" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(2);

            var count = 0;

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('message', function (msg) {
                        count++;
                        test.ok(msg.text === 'im a message');
                        if (count === 2) {done(); return;}
                        bus.publish('message', {text: 'im a message'});
                    });
                });
            });

            bus.publish('message', {text: 'im a message'});
            _(done).delay(1000);
        },
        "publish message on different handlers of same messages types to the bus" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(2);
            var count = 0;
            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('message', function (msg) {
                        count++;
                        test.ok(msg.text === 'im a message');
                        if (count === 2) {done()};
                    });
                    subs.handler('message', function (msg) {
                        count++;
                        test.ok(msg.text === 'im a message');
                        if (count === 2) {done()};
                    });
                });
            });

            bus.publish('message', {text: 'im a message'});
            _(done).delay(1000);
        },
        "publish different parallel messages types to the bus" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(2);
            var count = 0;

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('message1', function (msg) {
                        test.ok(msg.text === 'im first message');
                        count++;
                        if (count === 2) {
                            done();
                        }
                    });
                    subs.handler('message2', function (msg) {
                        test.ok(msg.text === 'im second message');
                        count++;
                        if (count === 2) {
                            done();
                        }
                    });
                });
            });

            bus.publish('message1', {text: 'im first message'});
            bus.publish('message2', {text: 'im second message'});
            _(done).delay(1000);
        },
        "publish message using getType message method" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        test.ok(msg.text === 'hi');
                        done();
                    });
                });
            });

            bus.publish({text: 'hi', getMessageType : function(){return 'yourmessage'}});
            _(done).delay(1000);
        },
        "publish message fault in case of consumer error after five retrieve" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);
            var handledFault = false;

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        if (!handledFault) {
                            throw new Error('fake error');
                        }
                    });
                    subs.handler('fault', function (msg) {
                        test.ok(true);
                        handledFault = true;
                        done();
                    });
                });
            });
            bus.publish({text: 'hi', getMessageType : function(){return 'yourmessage'}});
            _(done).delay(1000);
        },
        "message will be publish again after a consumer error" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);
            var handledFault = false;

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        if (!handledFault) {
                            handledFault = true;
                            throw new Error('fake error');
                        } else {
                            test.ok(true);
                            done();
                        }
                    });
                });
            });
            bus.publish({text: 'hi', getMessageType : function(){return 'yourmessage'}});
            _(done).delay(1000);
        },
        "message asyn will be publish again after a consumer error" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);
            var handledFault = false;

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('loopback://localhost/test_queue');
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        var defer = Q.defer();
                        _(function() {
                            if (!handledFault) {
                                handledFault = true;
                                defer.reject(new Error('fake error'));
                            } else {
                                test.ok(true);
                                done();
                                defer.resolve();
                            }
                        }).delay(50);
                        return defer.promise;
                    });
                });
            });
            bus.publish({text: 'hi', getMessageType : function(){return 'yourmessage'}});
            _(done).delay(1000);
        },*/
        "configure bus with mongodb transport" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);

            var bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                sbc.receiveFrom('mongodb://localhost/test_queue');
                sbc.useMongoDb(connectionFactory);
                sbc.subscribe(function (subs){
                    subs.handler('yourmessage', function (msg) {
                        test.ok(msg.text === 'hi');
                        done();
                    });
                });
            });

            bus.publish('yourmessage', {text: 'hi'});
           // _(done).delay(5000);
        },
        "purge on startup mongodb transport" : function(test) {
            var done = _( function () {if (bus) {bus.dispose();} test.done(); }).once();
            test.expect(1);

            var db = connectionFactory('localhost', 27017, 'test_queue');

            var bus;
            var testrun = function () {
                bus = ServiceBus.ServiceBusFactory.New(function (sbc) {
                    sbc.receiveFrom('mongodb://localhost/test_queue');
                    sbc.useMongoDb(connectionFactory);
                    sbc.setPurgeOnStartup(true);
                    sbc.subscribe(function (subs){
                        subs.handler('yourmessage', function (msg) {
                            test.ok(msg.text === 'hi');
                            done();
                        });
                    });
                });

                bus.publish('yourmessage', {text: 'hi'});
            };

            var mongo = new System.Data.Mongo.MongoDb(db);
            mongo.
                openCollection('bus').
                insert({fake:'item'}).
                done().
                close(function () {
                    testrun();
                });

            //_(done).delay(1000);
        }

        //TODO: test mongo transport error
        //TODO: test serialization error (message should be moved to error queue)
    };
}());