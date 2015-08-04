'use strict';
/* global angular, _ */

/**
 * The Commander service is responsible
 *  for managing commander-global values,
 *  and providing a convenient way to
 *  bind to them. Simply add `{getterSetter: true}`
 *  to the ng-model-options of your form,
 *  and use `prop(name, defaultVal)` to get
 *  a bindable reference to a property
 *
 * The Commander has several shared properties
 *  that can be accessed directly on the commander
 *  as fields, so the default values can be set
 *  here and shared:
 *
 *      - cash
 *      - cargo
 *      - jump-range
 *      - pad-size
 *
 * Values that are specific to your view should
 *  use the `prop()` syntax, but those that are
 *  shared should be created as new fields. Note,
 *  however, that all names are global, so consider
 *  prefixing properties created via `prop()`.
 *
 */
angular.module('emfd')
.factory('commander', ['$rootScope', 'websocket', function($rootScope, $ws) {
    var _data = { };

    $ws.registerGlobal('commander_data', function(packet) {
        _data = _.extend(_data, packet.data);
        $rootScope.destination = service.destination($rootScope.currentSystem.system);        
        $rootScope.$broadcast('emfd.commander-data', packet);
    });

    var update = function(field, value) {
        _data[field] = value;

        // send updated value
        console.log("Update!", field, value);
        $ws.send({
            type: 'commander'
          , field: field
          , value: value
        });
    };

    var newField = function(fieldName, defaultValue) {
        return function(newValue) {
            var oldValue = _data[fieldName];
            if (angular.isDefined(newValue)) {
                update(fieldName, newValue);
            } else if (!angular.isDefined(oldValue)) {
                _data[fieldName] = defaultValue;
                return defaultValue;
            }

            return oldValue;
        }
    }

    var service = {
        /* 
         * Shared fields 
         */
        cash: newField('cash', 1000)
      , cargo: newField('cargo', 4)
      , 'jump-range': newField('jump-range', 10)
      , 'pad-size': newField('pad-size', 'Small'),
        destinations: newField('destinations',[])

        /*
         * Shared Constants
         */
      , VALID_PAD_SIZES: ['Small', 'Medium', 'Large']
    };

    /** straightforward getter */
    service.get = function(name) {
        return _data[name];
    }

    /** Per-view fields */
    service.prop = function(name, defaultValue) {
        if (!service[name]) {
            service[name] = newField(name, defaultValue);
        }

        return service[name];
    }

    /* Given a form dict, replace any of our getters
     * with their current value */
    service.form = function(form) {
        return _.reduce(_.keys(form),
        function(result, key) {
            var val = form[key];
            result[key] = _.isFunction(val)
                ? val()
                : val;
            return result;
        }, {});
    }
    
    /** Return a CMDR based info on destination **/
    service.destination = function(system) {
        var destination = {
            isFavorite:false,
            currentNotes:""
        };
        for(var i in _data.destinations) {
            if(_data.destinations[i].name == system){
               destination.currentNotes = _data.destinations[i].notes;
               destination.isFavorite = _data.destinations[i].favorite;
            }
        }
        return destination;        
    } 
    
    /** Update favorite status for a system **/
    service.setFavorite =function(system,makeFavorite){
        var newDestination = true;
        for(var i in _data.destinations) {
            if(_data.destinations[i].name == system){
               _data.destinations[i].favorite = makeFavorite;
               newDestination = false;
            }
        }
        if(newDestination){
            _data.destinations.push({name:system,favorite:makeFavorite,notes:""}); 
        }
        update("destinations",_data.destinations);
        $rootScope.destination = service.destination($rootScope.currentSystem.system);
    }
    
    /** Update notes for a given system **/
    service.setNotes = function(system,notes){
        var newDestination = true;    
        for(var i in _data.destinations) {
            if(_data.destinations[i].name == system){
               _data.destinations[i].notes = notes;
               newDestination = false;               
            }          
        }
        if(newDestination){
           _data.destinations.push({name:system,favorite:false,notes:notes}); 
        }          
        update("destinations",_data.destinations);
        $rootScope.destination = service.destination($rootScope.currentSystem.system);
    }
    return service;
}]);
