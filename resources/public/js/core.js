'use strict';
/* global angular */

angular.module('emfd')

.controller('CoreController', ['$rootScope', 'websocket',
        function($rootScope, websocket) {

    $rootScope.connected = false;
    $rootScope.everConnected = false;

    window.ws = websocket;
    websocket.registerStatus('close', function() {
        $rootScope.$apply(function() {
            $rootScope.connected = false;
        });
    });

    websocket.registerGlobal('on_system', function(packet) {
        console.log("<<", packet);
        $rootScope.$apply(function() {
            // we set connected when we get the first
            //  on_system packet for better UX
            $rootScope.connected = true;
            $rootScope.everConnected = true;

            $rootScope.currentSystem = packet;
        });
    });

    websocket.registerGlobal('error', function(packet) {
        console.error("<<", packet);
    });

}])

.directive('stationsModal', function() {
    return {
        restrict: 'E',
        templateUrl: 'js/modals/stations.html'
    }
})

.directive('autoStations', ['$compile', '$parse', 'SharedState', 'websocket', 
        function($compile, $parse, SharedState, $websocket) {
    return {
        restrict: 'A',
        link: function($scope, $el, $attrs) {
            $scope._stationsDeployed = false;
            $scope.autoStationsData = {
                input: $($el).val() // prefill with current
              , results: null
            };
            var modelValue = $parse($attrs.ngModel);

            // if we wanted to be fancier about registerLocal to not
            //  totally override then we'd have less boilerplate here,
            //  but so far this is the only case where we'd need that....
            $websocket.registerGlobal("stations_result", function(packet) {
                if (packet.q != $scope.autoStationsData.input) 
                    return;
                $scope.$apply(function() {
                    $scope.autoStationsData.results = packet.result;
                });
            });
            $scope.$on('$destroy', function() {
                // unregister
                $websocket.registerGlobal('stations_result', null);
            });

            $scope.$watch('autoStationsData.input', function(newValue) {
                if (newValue.length > 1) {
                    $websocket.send({
                        type: "stations"
                      , q: newValue
                    });
                } else if (!newValue.length) {
                    $scope.autoStationsData.results = null;
                }
            });

            $scope.onModalStationClosed = function() {
                // update the element with the input value
                // $el.val($scope.autoStationsData.input.trim());
                modelValue.assign($scope, $scope.autoStationsData.input.trim());
            }

            $scope.selectResult = function(row) {
                $scope.autoStationsData.input = row.Station;
                $scope.onModalStationClosed(); // have to call manually
                SharedState.set('modalStation', false);
            }

            $($el).focus(function() {
                // DON'T focus; that would show the keyboard
                $($el).blur();

                SharedState.initialize($scope, 'modalStation', {defaultValue: true});

                // show the modal for selection
                if (!$scope._stationsDeployed) {
                    $scope._stationsDeployed = true;
                    var modal = $compile("<stations-modal></stations-modal>")($scope);

                    $(document.body).append(modal);
                } else {
                    SharedState.set('modalStation', true);
                }

            });
        }
    };
}])

.filter('bigNumber', function() {
    /**
     * If you have a unit after the number, for example,
     *  but want a space between the number an the unit,
     *  you can use as `bigNumber:' '` and we'll put the
     *  space before the 'M' or 'K'
     */
    return function(input, after) {
        after = after || '';
        if (input > 10e6) {
            return Math.round(input / 1e6) + after + 'M';
        } else if (input > 10e3) {
            return Math.round(input / 1e3) + after + 'K';
        } else {
            return input + after;
        }
    }
});
