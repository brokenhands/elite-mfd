'use strict';
/* jshint indent:false */
/* global angular */

angular.module('emfd.views.stations', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/stations/:system/:station/:ref', {
        templateUrl: 'js/views/stations/stations.html'
      , controller: 'StationController'
    });
}])

.controller('StationController', [
        '$scope', '$routeParams', 'dataStore', 'websocket',
        function($scope, $routeParams, dataStore, websocket) {

    $scope.system = $routeParams.system;
    $scope.station = $routeParams.station;
    $scope.ref = $routeParams.ref;

    websocket.registerLocal($scope, {
        calculate_result: function(result) {
            if (result && result.result)
                $scope.returnTrades = result.result;
        }
    });

    switch ($scope.ref) {
    case 'trading':
        $scope.trade = JSON.parse($routeParams.trade);
        $scope.subtitle = "Selected Trade";

        $scope.distance = $scope.trade.distance;
        $scope.distanceFromJumpIn = $scope.trade.destDistanceFromJumpIn;

        var form = JSON.parse($routeParams.form);
        form['station-name-end'] = form['station-name'];
        form['station-name'] = $scope.station + ' (' + $scope.system + ')';
        form['min-profit'] /= 10;
        console.log(form);
        websocket.send(form);
        break;

    case 'search':
        $scope.search = JSON.parse($routeParams.result);
        $scope.subtitle = null; // station name is sufficient

        $scope.distance = $scope.search.Distance;
        $scope.distanceFromJumpIn = $scope.search.Station.DistanceFromJumpIn;

        $scope.commodity = $routeParams.commodity;
        $scope.searchType = $routeParams.mode;
        console.log($routeParams);
        break;
    }

    // if (dataStore[$routeParams.ref]) {
    //     $scope[$routeParams.ref] = dataStore[$routeParams.ref][$routeParams.index];
    // }
    
    $scope.performNavMacro = function(systemName) {
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
