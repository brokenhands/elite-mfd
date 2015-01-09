'use strict';

/* global angular */
angular.module('emfd', [
    'ngRoute'
  , 'mobile-angular-ui'
  , 'emfd.views.home'
  , 'emfd.views.trading'
  , 'emfd.views.trading.search'
])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/home'});
}]);
