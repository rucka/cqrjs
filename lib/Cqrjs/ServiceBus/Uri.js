"use strict";
define(['../../root', 'mdcore', 'underscore', 'url'], function (Cqrjs, System, _, url) {
    Cqrjs.namespace("Cqrjs.ServiceBus");
    var ServiceBus = Cqrjs.ServiceBus;

    ServiceBus.Uri = (function () {

        function Uri(uri) {
            Uri.ensureIsUrl(uri);
            Object.defineProperty(this, 'url', {
                enumerable: true,
                writable: false,
                value : (_(uri).isString() ? url.parse(uri) : uri)
            });

            Object.defineProperty(this, 'scheme', {
                enumerable: true,
                get: function () {
                    return this.url.protocol.substring(0, this.url.protocol.length - 1);
                }
            });
        }

        Uri.prototype.toString = function () {
            return url.format(this.url);
        };

        Uri.isUrl = function (uri) {
            var res = _(uri).isString() ? url.parse(uri) : uri;

            if (!res.protocol) {
                return false;
            }

            if (!res.hostname) {
                return false;
            }

            if (res.search) {
                return false;
            }
            return true;
        };

        Uri.isUri = function (uri) {
            return uri.toString && uri.url;
        };

        Uri.ensureIsUri = function (uri) {
            if (!Uri.isUri(uri)) {
                throw new Error('parameter is not an uri');
            }
        };

        Uri.ensureIsUrl = function (uri) {
            var res = _(uri).isString() ? url.parse(uri) : uri;

            if (!res.protocol) {
                throw new Error('protocol not found in url');
            }

            if (!res.hostname) {
                throw new Error('hostname not found in url');
            }

            if (res.search) {
                throw new Error('expected not querystring in url "' + res.search + '".');
            }
        };

        return Uri;
    }());
});