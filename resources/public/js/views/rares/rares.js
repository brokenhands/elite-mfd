'use strict';
/* jshint indent:false */
/* global angular */

angular.module('emfd.views.rares', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/rares/:system', {
        templateUrl: 'js/views/rares/rares.html'
      , controller: 'RaresController'
    });
}])

.controller('RaresController', [
        '$scope', '$routeParams', 'dataStore', 'websocket',
        function($scope, $routeParams, dataStore, websocket) {
    $scope.system = $routeParams.system;            

    websocket.registerLocal($scope, {
        rares_result: function(result) {
            $scope.results = dataStore.search = result.result;
        }
    });

    websocket.send({type:"rares", system: $scope.system});
    
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
