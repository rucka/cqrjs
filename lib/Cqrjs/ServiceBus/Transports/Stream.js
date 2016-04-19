"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Transports");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Transports.Stream = (function () {

        var dataField = System.ComponentModel.PrivateName();
        function Stream() {
            var that = this;
            this[dataField] = [];
            Object.defineProperty(this, 'length', {
                enumerable: true,
                get : function () {return that[dataField].length;}
            })
        }

        Stream.prototype.write = function (buffer, offset, count) {
            if (!_(buffer).isArray()) {throw new Error('buffer must be an array');}
            offset = _(offset).isUndefined() ? 0 : offset;
            count = _(count).isUndefined() ? buffer.length : count;

            if (offset > 0) {throw new Error('offset not yet supported');}

            var i;
            for (i = 0; i < count; i++) {
                if (i >= this[dataField].length) {
                    this[dataField].push(buffer[i]);
                    continue;
                }
                this[dataField][i] = buffer[i];
            }
        };

        Stream.prototype.read = function (buffer, offset, count) {
            if (!_(buffer).isArray()) {throw new Error('buffer must be an array');}
            offset = _(offset).isUndefined() ? 0 : offset;
            count = _(count).isUndefined() ? this[dataField].length : count;

            if (offset > 0) {throw new Error('offset not yet supported');}

            var i;
            for (i = 0; i < count; i++) {
                if (i >= buffer.length) {
                    buffer.push(this[dataField][i]);
                    continue;
                }
                buffer[i] = this[dataField][i];
            }
        };

        Stream.prototype.copyTo = function (stream) {
            stream[dataField] = _(this[dataField]).clone();
        };

        return Stream;
    }());
});