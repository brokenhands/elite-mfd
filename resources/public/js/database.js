'use strict';
/* global angular, _ */

/**
 *
 *
 */
/*
angular.module('emfd')
.factory('database', ['$rootScope', 'websocket', function($rootScope, $ws) {
    var _data = { };
    var navlog = new sqlite3.Database("navlog.db");

    $ws.registerGlobal('database_data', function(packet) {
        _data = _.extend(_data, packet.data);
        $rootScope.$broadcast('emfd.database-data', packet);
    });

    var createdb = function(){

          navlog.serialize(function() {
          navlog.run("CREATE TABLE arrivals (system TEXT)");

          var stmt = navlog.prepare("INSERT INTO arrivals VALUES (?)");
          for (var i = 0; i < 10; i++) {
              stmt.run("Ipsum " + i);
          }
          stmt.finalize();

          navlog.each("SELECT rowid AS id, system FROM lorem", function(err, row) {
              console.log(row.id + ": " + row.info);
          });
        });

        navlog.close();
    };
    console.log("Going to try to create now...");
    createdb();
    
    var logArrival = function(){
        var system = $rootScope.system;
        var navlog = new sqlite3.Database("navlog.db");
        navlog.exec("INSERT INTO arrivals VALUES ('"+system+"')");
    }
}]);
    */