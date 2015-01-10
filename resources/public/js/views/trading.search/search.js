'use strict';
/* jshint indent:false */
/* global angular */

var COMMODITIES = [    
    {id:"45", name:"Agri-Medicines"},
    {id:"16", name:"Algae"},
    {id:"24", name:"Aluminium"},
    {id:"14", name:"Animal Meat"},
    {id:"35", name:"Animal Monitors"},
    {id:"34", name:"Aquaponic Systems"},
    {id:"80", name:"Atmospheric Processors"},
    {id:"48", name:"Auto-Fabricators"},
    {id:"23", name:"Basic Medicines"},
    {id:"79", name:"Battle Weapons"},
    {id:"30", name:"Bauxite"},
    {id:"59", name:"Beer"},
    {id:"47", name:"Bertrandite"},
    {id:"69", name:"Beryllium"},
    {id:"49", name:"Bioreducing Lichen"},
    {id:"39", name:"Biowaste"},
    {id:"89", name:"Chemical Waste"},
    {id:"7", name:"Clothing"},
    {id:"28", name:"Cobalt"},
    {id:"9", name:"Coffee"},
    {id:"29", name:"Coltan"},
    {id:"44", name:"Combat Stabilisers"},
    {id:"32", name:"Computer Components"},
    {id:"6", name:"Consumer Technology"},
    {id:"72", name:"Copper"},
    {id:"19", name:"Crop Harvesters"},
    {id:"5", name:"Domestic Appliances"},
    {id:"1", name:"Explosives"},
    {id:"13", name:"Fish"},
    {id:"12", name:"Food Cartridges"},
    {id:"61", name:"Fruit and Vegetables"},
    {id:"57", name:"Gallite"},
    {id:"68", name:"Gallium"},
    {id:"25", name:"Gold"},
    {id:"15", name:"Grain"},
    {id:"52", name:"H.E. Suits"},
    {id:"4", name:"Hydrogen Fuel"},
    {id:"92", name:"Imperial Slaves"},
    {id:"56", name:"Indite"},
    {id:"66", name:"Indium"},
    {id:"33", name:"Land Enrichment Systems"},
    {id:"38", name:"Leather"},
    {id:"58", name:"Lepidolite"},
    {id:"8", name:"Liquor"},
    {id:"64", name:"Lithium"},
    {id:"22", name:"Marine Equipment"},
    {id:"20", name:"Microbial Furnaces "},
    {id:"21", name:"Mineral Extractors"},
    {id:"3", name:"Mineral Oil"},
    {id:"43", name:"Narcotics"},
    {id:"73", name:"Natural Fabrics"},
    {id:"53", name:"Non-Lethal Wpns"},
    {id:"65", name:"Palladium"},
    {id:"55", name:"Performance Enhancers"},
    {id:"41", name:"Personal Weapons"},
    {id:"2", name:"Pesticides"},
    {id:"84", name:"Platinum"},
    {id:"70", name:"Polymers"},
    {id:"82", name:"Power Generators"},
    {id:"46", name:"Progenitor Cells"},
    {id:"54", name:"Reactive Armour"},
    {id:"50", name:"Resonating Separators"},
    {id:"36", name:"Robotics"},
    {id:"31", name:"Rutile"},
    {id:"40", name:"Scrap"},
    {id:"71", name:"Semiconductors"},
    {id:"63", name:"Silver"},
    {id:"93", name:"Slaves"},
    {id:"62", name:"Superconductors"},
    {id:"74", name:"Synthetic Fabrics"},
    {id:"60", name:"Synthetic Meat"},
    {id:"26", name:"Tantalum"},
    {id:"10", name:"Tea"},
    {id:"27", name:"Titanium"},
    {id:"75", name:"Tobacco"},
    {id:"78", name:"Uraninite"},
    {id:"67", name:"Uranium"},
    {id:"83", name:"Water Purifiers"},
    {id:"77", name:"Wine"}
];

angular.module('emfd.views.trading.search', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/search/:system', {
        templateUrl: 'js/views/trading.search/search.html'
      , controller: 'SearchController'
    });
}])

.controller('SearchController', [
        '$scope', '$routeParams', 'websocket',
        function($scope, $routeParams, websocket) {

    var noFiltersDescription = "(Edit Filters)";
    $scope.system = $routeParams.system;
    $scope.form = {
        type: 'search'
      , system: $scope.system
        // TODO etc.
      , 'search-type': 'selling'
      , 'pad-size': 'Small'
      , 'search-range': '15'
    };

    $scope.validSizes = ['Small', 'Medium', 'Large'];
    $scope.validRanges = ['15', '25', '50'];
    $scope.validCommodities = COMMODITIES;
    $scope.filtersDescription = noFiltersDescription;

    // NB: we have to store this in an object for it to
    //  get persisted across the filters modal correctly. 
    //  Something about prototypical inheritance....
    //  See: http://stackoverflow.com/questions/18716113
    $scope.data = {
        selectedCommodity: null,
    }

    var updateFilterDesc = function(data) {
        var desc = '';
        if (data.selectedCommodity) {
            desc += 'Station ' + $scope.form['search-type'] 
                    + ' ' + data.selectedCommodity.name;
        }

        $scope.filtersDescription = desc || noFiltersDescription;
    };
    $scope.$watchCollection('data', updateFilterDesc);

    // watch search-type to trigger updates as well
    $scope.$watch('form["search-type"]', function() {
        updateFilterDesc($scope.data);
    });

    $scope.results = null;

    websocket.registerLocal($scope, {
        search_result: function(result) {
            console.log("Results!", result);
            $scope.results = result.result;
        }
    });

    $scope.onSearch = function() {
        if ($scope.data.selectedCommodity) {
            $scope.form['commodity-id'] = $scope.data.selectedCommodity.id;
        }
        console.log($scope.form);
        $scope.results = null;
        websocket.send($scope.form);
    };
}]);