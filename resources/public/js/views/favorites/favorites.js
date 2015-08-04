'use strict';
/* jshint indent:false */
/* global angular */

angular.module('emfd.views.favorites', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/favorites', {
        templateUrl: 'js/views/favorites/favorites.html'
      , controller: 'FavoritesController'
    });
}])

.controller('FavoritesController', [
        '$scope', '$routeParams', 'commander', 'websocket',
        function($scope, $routeParams, commander, websocket) {
  /*
    websocket.registerLocal($scope, {
        destinations_result: function(result) {
            $scope.results = dataStore.search = result.result;
        }
    });*/
    var destinations = commander.get('destinations');
    $scope.destinations = destinations.sort(function(a,b){
        return a.name.localeCompare(b.name);
    });
    $scope.performNavMacro = function(systemName) {
        systemName = systemName.substring(0,systemName.indexOf(" ("));
        websocket.send({
            type: 'macro'
          , macro: ['galaxy-map', 'macro-wait', 
                    'tab-right', 'ui-select', // select the field
                    'backspace', // if `space` is ui-select, one is added
                    '"' + systemName + '"', // finally type
                    'press-enter','macro-wait', 'macro-wait', // map is slow to find
                    'ui-right', 'ui-select',
                    'galaxy-map'
                    ]
        });
    }                
}]);
