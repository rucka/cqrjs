"use strict";
define(['../../root'], function (Cqrjs) {
    Cqrjs.namespace("Cqrjs.ServiceBus");

    Cqrjs.ServiceBus.BusServiceLayer = (function(){
        return {
            Network: 0,
            Session:1,
            Presentation:2,
            Application:3
        };
    }());
});