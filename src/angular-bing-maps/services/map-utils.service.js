/*global angular, Microsoft, DrawingTools, console*/

function mapUtilsService($q, angularBingMaps) {
    'use strict';
    var color = require('color');
    var advancedShapesLoaded = false;
    var isBingMapsLoaded = false;
    var bingMapsOnLoadCallbacks = [];

    function makeMicrosoftColor(colorStr) {
        var c = color(colorStr);
        return new Microsoft.Maps.Color(Math.floor(255*c.alpha()), c.red(), c.green(), c.blue());
    }

    function makeMicrosoftLatLng(location) {
        if (angular.isArray(location)) {
            return new Microsoft.Maps.Location(location[1], location[0]);
        } else if (location.hasOwnProperty('latitude') && location.hasOwnProperty('longitude')) {
            return new Microsoft.Maps.Location(location.latitude, location.longitude);
        } else if (location.hasOwnProperty('lat') && location.hasOwnProperty('lng')) {
            return new Microsoft.Maps.Location(location.lat, location.lng);
        } else {
            if(console && console.error) {
                console.error('Your coordinates are in a non-standard form. '+
                              'Please refer to the Angular Bing Maps '+
                              'documentation to see supported coordinate formats');
            }
            return null;
        }
    }

    function convertToMicrosoftLatLngs(locations) {
        var bingLocations = [];
        if (!locations) {
            return bingLocations;
        }
        for (var i=0;i<locations.length;i++) {
            var latLng = makeMicrosoftLatLng(locations[i]);
            bingLocations.push(latLng);
        }
        return bingLocations;
    }

    function flattenEntityCollection(ec) {
        var flat = flattenEntityCollectionRecursive(ec);
        var flatEc = new Microsoft.Maps.EntityCollection();
        var entity = flat.pop();
        while(entity) {
            flatEc.push(entity);
            entity = flat.pop();
        }
        return flatEc;
    }

    function flattenEntityCollectionRecursive(ec) {
        var flat = [];
        var entity = ec.pop();
        while(entity) {
            if (entity && !(entity instanceof Microsoft.Maps.EntityCollection)) {
                flat.push(entity);
            } else if (entity) {
                flat.concat(flattenEntityCollectionRecursive(entity));
            }
            entity = ec.pop();
        }
        return flat;
    }

    function loadAdvancedShapesModule() {
        var defered = $q.defer();
        if(!advancedShapesLoaded) {
            Microsoft.Maps.loadModule('Microsoft.Maps.AdvancedShapes', { callback: function(){
                defered.resolve();
            }});
        } else {
            defered.resolve();
        }
        return defered.promise;
    }

    function createFontPushpin(text, fontSizePx, color) {
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');

        //Define font style
        var font = fontSizePx + 'px ' + angularBingMaps.getIconFontFamily();
        ctx.font = font;

        //Resize canvas based on sie of text.
        var icon = String.fromCharCode(parseInt(text, 16));
        var size = ctx.measureText(icon);
        c.width = size.width;
        c.height = fontSizePx;

        //Reset font as it will be cleared by the resize.
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;

        ctx.fillText(icon, 0, 0);

        return {
            icon: c.toDataURL(),
            anchor: new Microsoft.Maps.Point(c.width / 2, c.height)
        };
    }

    function onBingMapsReady(callback) {
        if (isBingMapsLoaded) {
            callback();
        } else {
            bingMapsOnLoadCallbacks.push(callback);
        }
    }

    function _executeOnBingMapsReadyCallbacks() {
        isBingMapsLoaded = true;
        for (var i=0; i<bingMapsOnLoadCallbacks.length; i++) {
            bingMapsOnLoadCallbacks[i]();
        }
        bingMapsOnLoadCallbacks = null;
    }

    return {
        makeMicrosoftColor: makeMicrosoftColor,
        makeMicrosoftLatLng: makeMicrosoftLatLng,
        convertToMicrosoftLatLngs: convertToMicrosoftLatLngs,
        flattenEntityCollection: flattenEntityCollection,
        loadAdvancedShapesModule: loadAdvancedShapesModule,
        createFontPushpin: createFontPushpin,
        onBingMapsReady: onBingMapsReady,
        _executeOnBingMapsReadyCallbacks: _executeOnBingMapsReadyCallbacks
    };

}

angular.module('angularBingMaps.services').service('MapUtils', mapUtilsService);
