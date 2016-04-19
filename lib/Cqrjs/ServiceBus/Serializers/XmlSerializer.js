"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Serializers");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Serializers.XmlSerializer = (function () {
        var XmlSerializer = function () {
            throw new Error('not supported');
            Object.defineProperty(this, 'contentType', {
                enumerable: true,
                writable: false,
                value: 'application/vnd.masstransit+xml'
            });
        }

        XmlSerializer.prototype.serialize = function (stream, sendcontext) {
            try {
                var namespaces = {
                    "http://serializer.org/": "ex"
                };
                var envelope = ServiceBus.Serializers.Envelope.Create(sendcontext);
                var xml = jxs.serialize(envelope, undefined, namespaces);

            } catch (e) {
                var error = new Error('Failed to serialize message');
                error.errorType = 'SerializationError';
                error.innerError = e;
                throw error;
            }
        };

        XmlSerializer.prototype.deserialize = function (receivecontext) {

        };


        return XmlSerializer;
    }());

    var jxs = (function() {
        function serialize( parent, member, obj, rules, namespaces ) {
            if( rules == undefined ) {
                return serialize_default( obj );
            }

            // write namespaces in the root element
            var xmlns = "";
            if( parent == null ) {
                for( var namespace in namespaces ) {
                    var prefix = namespaces[ namespace ];
                    xmlns += "xmlns:" + prefix + "='" + namespace + "' ";
                }
            }

            var retval = "";
            var rule;
            if( obj == null ) {
                // don't serialize null values
                return retval;
            }

            if( parent != null ) {
                rule = rules[ getName( parent ) ][ member ];
            }
            else {
                rule = rules[ getName( obj ) ][ "__def__" ];
            }
            if( rule == undefined ) {
                rule = rules[ getName( obj ) ][ "__def__" ];
            }
            if( rule.nodetype == "element" ) {
                var prefix = namespaces[ rule.namespace ] || rule.namespace || "";
                if( prefix != "" ) {
                    prefix += ":";
                }
                // TODO: if prefix not found, we should set xmlns: to the namespace of the element, if
                // element is in a namespace
                retval = "\n" + "<" + prefix + rule.nodename + processAttributes( obj, rules, namespaces ) + getXmlns( xmlns ) + ">";
                if( typeOf( obj ) == 'object' || typeOf( obj ) == 'array' ) {
                    for( var item in obj ) {
                        retval += serialize( obj, item, obj[item], rules, namespaces );
                    }
                }
                else {
                    retval += obj;
                }
                retval += "</" + prefix + rule.nodename + ">";
            }
            else if( rule.nodetype == "content" ) {
                retval += obj;
            }
            return retval;
        }

        function processAttributes( obj, rules, namespaces ) {
            var retval = "";
            for( var item in obj ) {
                var rule = rules[ getName( obj ) ][ item ];
                if( rule && rule.nodetype == "attribute" ) {
                    var prefix = namespaces[ rule.namespace ] || rule.namespace || "";
                    if( prefix != "" ) {
                        prefix += ":";
                    }
                    retval += " " + prefix + rule.nodename + "='" + obj[ item ] + "'";
                }
            }
            return retval;
        }

        function serialize_default( obj ) {
            var retval = "<" + getName( obj ) + ">\n";
            if( typeOf( obj ) == 'object' || typeOf( obj ) == 'array' ) {
                for( var item in obj ) {
                    retval += serialize_default( obj[item] );
                }
            }
            else {
                retval += obj + "\n";
            }
            retval += "</" + getName( obj ) + ">\n";
            return retval;
        }

        /**
         * Performs some formatting on the namespace
         */
        function getXmlns( name ) {
            if( name == "" ) {
                return "";
            }
            else {
                return " " + name;
            }
        }

        /**
         * getname from stack overflow
         * http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
         */
        function getName( obj ) {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((obj).constructor.toString());
            return (results && results.length > 1) ? results[1] : "";
        };

        /**
         * export a simplified serialize function
         */
        return {
            serialize: function( obj, rule, ns ) {
                return serialize( null, null, obj, rule, ns );
            }
        };
    })();

    function typeOf(value) {
        var s = typeof value;
        if (s === 'object') {
            if (value) {
                if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                    s = 'array';
                }
            } else {
                s = 'null';
            }
        }
        return s;
    }
});