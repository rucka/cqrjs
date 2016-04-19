"use strict";
define(['../../../root', 'mdcore', 'underscore'], function (Cqrjs, System, _) {
    Cqrjs.namespace("Cqrjs.ServiceBus.Serializers");
    var ServiceBus = Cqrjs.ServiceBus;
    ServiceBus.Serializers.Utf8 = (function (){
        return {
            ToByteArray : function (string) {
                var byteArray = [];
                for (var i = 0; i < string.length; i++)
                    if (string.charCodeAt(i) <= 0x7F)
                        byteArray.push(string.charCodeAt(i));
                    else {
                        var h = encodeURIComponent(string.charAt(i)).substr(1).split('%');
                        for (var j = 0; j < h.length; j++)
                            byteArray.push(parseInt(h[j], 16));
                    }
                return byteArray;
            },
            Parse : function (byteArray) {
                var str = '';
                for (var i = 0; i < byteArray.length; i++)
                    str +=  byteArray[i] <= 0x7F?
                        byteArray[i] === 0x25 ? "%25" : // %
                            String.fromCharCode(byteArray[i]) :
                        "%" + byteArray[i].toString(16).toUpperCase();
                return decodeURIComponent(str);
            }
        };
    }());
});