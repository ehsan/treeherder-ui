'use strict';

/* Services */
treeherder.factory('thUrl',
                   ['$rootScope', 'thServiceDomain',
                   function($rootScope, thServiceDomain) {
    return {
        getRootUrl: function(uri) {
            return thServiceDomain + "/api" + uri;
        },
        getProjectUrl: function(uri) {
            return thServiceDomain + "/api/project/" + $rootScope.repoName + uri;
        },
        getLogViewerUrl: function(artifactId) {
            return "logviewer.html#?id=" + artifactId + "&repo=" + $rootScope.repoName;
        },
        getSocketEventUrl: function() {
            var port = thServiceDomain.indexOf("https:") !== -1 ? 443 :80;
            return thServiceDomain + ':' + port + '/events';
        }
    };
    return thUrl;

}]);

treeherder.factory('thArtifact',
                   ['$http', 'thUrl',
                   function($http, thUrl) {

    // get the artifacts for this tree
    return {
        getArtifact: function(id) {
            return $http.get(thUrl.getProjectUrl(
                "/artifact/" + id + "/"));
        }
    }
}]);

treeherder.factory('thJobs',
                   ['$http', 'thUrl',
                   function($http, thUrl) {

    return {
        getJobs: function(offset, count, joblist) {
            offset = typeof offset == 'undefined'?  0: offset;
            count = typeof count == 'undefined'?  10: count;
            var params = {
                offset: offset,
                count: count,
                format: "json"
            }

            if (joblist) {
                $.extend(params, {
                    offset: 0,
                    count: joblist.length,
                    joblist: joblist.join()
                })
            }
            return $http.get(thUrl.getProjectUrl("/jobs/"),
                             {params: params}
            );
        }
    }
}]);

treeherder.factory('thRepos',
                   ['$http', 'thUrl', '$rootScope', '$log',
                   function($http, thUrl, $rootScope, $log) {

    // get the repositories (aka trees)
    // sample: 'resources/menu.json'
    var byName = function(name) {
        if ($rootScope.repos != undefined) {
            for (var i = 0; i < $rootScope.repos.length; i++) {
                var repo = $rootScope.repos[i];
                if (repo.name === name) {
                    return repo;
                }
            };
        } else {
            $log.warn("Repos list has not been loaded.")
        }
        $log.warn("'" + name + "' not found in repos list.")
        return null;
    }

    return {
        // load the list of repos into $rootScope, and set the current repo.
        load: function(name) {
            return $http.get(thUrl.getRootUrl("/repository/")).
                success(function(data) {
                    $rootScope.repos = data;
                    if (name) {
                        $rootScope.currentRepo = byName(name)
                    }
                });
        },
        // return the currently selected repo
        getCurrent: function() {
            return $rootScope.currentRepo;
        },
        // set the current repo to one in the repos list
        setCurrent: function(name) {
            $rootScope.currentRepo = byName(name)
        },
        // get a repo object without setting anything
        getRepo: function(name) {
            return byName(name);
        }
    };
}]);

treeherder.factory('thJobNote', function($resource, $http, thUrl) {
    return {
        get: function() {
            var JobNote = $resource(thUrl.getProjectUrl("/note/"));
            // Workaround to the fact that $resource strips trailing slashes
            // out of urls.  This causes a 301 redirect on POST because it does a
            // preflight OPTIONS call.  Tastypie gives up on the POST after this
            // and nothing happens.  So this alternative "thSave" command avoids
            // that by using the trailing slash directly in a POST call.
            // @@@ This may be fixed in later versions of Angular.  Or perhaps there's
            // a better way?
            JobNote.prototype.thSave = function() {
                $http.post(thUrl.getProjectUrl("/note/"), {
                    job_id: this.job_id,
                    note: this.note,
                    who: this.who,
                    failure_classification_id: this.failure_classification_id
                });
            };
            return JobNote;
        }
    };
});


treeherder.factory('thSocket', function ($rootScope, $log, thUrl) {
    var socket = io.connect(thUrl.getSocketEventUrl());
    socket.on('connect', function(){
       $log.debug('socketio connected');
    });
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});