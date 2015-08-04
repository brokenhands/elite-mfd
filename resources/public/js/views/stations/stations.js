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
        '$scope', '$routeParams', 'dataStore', 'websocket', 'commander',
        function($scope, $routeParams, dataStore, websocket, commander) {

    $scope.system = $routeParams.system;
    $scope.station = $routeParams.station;
    $scope.ref = $routeParams.ref;
    $scope.destination = commander.destination($routeParams.system);

    websocket.registerLocal($scope, {
        calculate_result: function(result) {
            if (result && result.result)
                $scope.returnTrades = result.result;
        }
    });

    switch ($scope.ref) {
    case 'trading':
        console.log($scope.destination);
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
}]);
