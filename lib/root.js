"use strict";
define(['mdcore', 'joeventstore'], function (System, EventStore) {
    var Cqrjs = Cqrjs || System.createRootNamespace('Cqrjs');
    Cqrjs.EventStore = EventStore;
    return Cqrjs;
});
