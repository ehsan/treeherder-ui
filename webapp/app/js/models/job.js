/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

treeherder.factory('ThJobModel', [
    '$http', 'ThLog', 'thUrl',
    function($http, ThLog, thUrl) {
    // ThJobModel is the js counterpart of job

    var ThJobModel = function(data) {
        // creates a new instance of ThJobModel
        // using the provided properties
        angular.extend(this, data);
    };
    ThJobModel.prototype.get_current_eta = function(){
        var timestampSeconds = new Date().getTime()/1000;
        return Math.round( ( timestampSeconds - (
                parseInt(this.submit_timestamp) + parseInt(this.pending_eta) +
                parseInt(this.running_eta) ) )/60 );
    }

    ThJobModel.prototype.get_typical_eta = function(){
        return Math.round(
            (parseInt(this.pending_eta) + parseInt(this.running_eta) )/60
        );
    }

    ThJobModel.get_uri = function(repoName){return thUrl.getProjectUrl("/jobs/", repoName);};

    ThJobModel.get_list = function(repoName, options, config) {
        // a static method to retrieve a list of ThJobModel
        config = config || {};
        var timeout = config.timeout || null;

        return $http.get(ThJobModel.get_uri(repoName),{
                params: options,
                timeout:timeout
            })
            .then(function(response) {
                var item_list = [];
                angular.forEach(response.data, function(elem){
                    item_list.push(new ThJobModel(elem));
                });
                return item_list;
        });
    };

    ThJobModel.get = function(repoName, pk, config) {
        // a static method to retrieve a single instance of ThJobModel
        config = config || {};
        var timeout = config.timeout || null;

        return $http.get(ThJobModel.get_uri(repoName)+pk+"/",
            {timeout:timeout})
            .then(function(response) {
            return new ThJobModel(response.data);
        });
    };

    ThJobModel.cancel = function(repoName, pk, config) {
        // a static method to retrieve a single instance of ThJobModel
        config = config || {};
        var timeout = config.timeout || null;

        return $http.post(ThJobModel.get_uri(repoName)+pk+"/cancel/",
            {timeout:timeout})
            .then(function(response) {
            return new ThJobModel(response.data);
        });
    };

    return ThJobModel;
}]);
