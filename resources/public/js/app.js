'use strict';

/* global angular */
angular.module('emfd', [
    'ngRoute'
  , 'mobile-angular-ui'
  , 'mobile-angular-ui.gestures'
  , 'emfd.views.home'
  , 'emfd.views.rares'    
  , 'emfd.views.macros'
  , 'emfd.views.stations'
  , 'emfd.views.trading'
  , 'emfd.views.trading.search'
  , 'emfd.views.navigate',
  , 'emfd.views.favorites'
])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/home'});
}]);
