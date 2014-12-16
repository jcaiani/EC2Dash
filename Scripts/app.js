/*
 * Create the module for the EC2 Dashboard.  This will be the module for the application.  
 * It will need to import other angular as well as non-angular modules.  In this case we have:
 * Angular Route, and Angular Resource, and Angular Bootstrap UI.
 * 
 * We also have our route provider.  This defines the controllers for each route we take in the UI
 * For this sample, we will use the same controller for the whole page.  This could be broken up
 * more, but this file isn't so large.
 * 
 * Our routes include the default route which shows all ec2 instances, 
 * and the group view which inclues a view by group.
 * 
 * Finally there is an app controller tha will help with the loading / unloading 
 * broadcasts and state changes for network calls.
 */
var EC2Dash = angular.module("EC2Dash", ["ngResource", "ngRoute", "ui.bootstrap"]).
    config(function ($routeProvider) {
        $routeProvider.
           when('/:itemId?', {
               controller: ListCtrl,
               templateUrl: 'EC2ListView.html'
           }).
           when('/group/:groupId', {
               controller: ListCtrl,
               templateUrl: 'EC2ListView.html'
           }).
            otherwise({
               redirectTo: '/'
           });
    }).controller('appController', ['$scope', function ($scope) {
        $scope.$on('LOAD'), function () { $scope.loading = true; };
        $scope.$on('UNLOAD'), function () { $scope.loading = false; };
       
    }]);

/*
 * We need two factories.  One for manipulation of EC2 objects, and one for Group objects. the update: put 
 * code tells the factory we also want the update capability to be added as the REST put method which
 * does not come automatically.
 */
EC2Dash.factory('EC2Factory', function ($resource) {
    return $resource('/api/EC2/:id', { id: '@id' }, { update: { method: 'PUT' } });
}).factory('GroupFactory', function ($resource) {
    return $resource('/api/Group/:id', { id: '@id' }, { update: { method: 'PUT' } });
});

/*
 * This is the main controller for the mvc application.  It will control data operations and
 * make sure the view is updated with the correct data.  We need to pass our factories into the
 * controller so the controller can make use of them for model queries and updates.
 */
var ListCtrl = function ($scope, $location, $routeParams, $modal, EC2Factory, GroupFactory) {
    var isGroup = ($routeParams.groupId !== undefined);
    var groupId = 0;
    var group;
    $scope.itemsForSelection = {};
    $scope.anItemIsSelected = false;

    $scope.$emit('LOAD');
    $scope.isGroup = false;

    if (isGroup) {
        $scope.isGroup = true;
    }
    /*
     * Search will query the data from the ec2 model and return it in items for display
     * by the view.  If we are searching on a group it will pass the group id's needed
     * for display so that we don't get the world.  
     */
    $scope.search = function () {
        if (isGroup) {
            groupId = $routeParams.groupId;
            group = GroupFactory.get({ id: groupId }, 
                function (data) {
                    if(group.Members) {
                        $scope.groupMembers = group.Members;
                    }
                    $scope.viewMessage = "View Group: " + group.Name;
                    EC2Factory.query({
                        q: $scope.query,
                        sort: $scope.sort_order,
                        desc: $scope.is_desc,
                        offset: $scope.offset,
                        limit: $scope.limit,
                        ids: $scope.groupMembers
                    },
                function (data) {
                    debugger;
                    $scope.more = data.length === 20;
                    $scope.items = $scope.items.concat(data);
                    $scope.$emit('UNLOAD');
                });
            });
        } else {
            $scope.viewMessage = "View All"
            EC2Factory.query({
                q: $scope.query,
                sort: $scope.sort_order,
                desc: $scope.is_desc,
                offset: $scope.offset,
                limit: $scope.limit
            },
                function (data) {
                    $scope.more = data.length === 20;
                    $scope.items = $scope.items.concat(data);
                    $scope.$emit('UNLOAD');
                });
        }
    };

    /*
     * Selections made is the method that manages what is selected
     * by the checboxes.  When a box is selected we want menu options enabled
     * and when deselected lets just clear it out of the list.
     */
    $scope.selectionsMade = function (selectedItems) {
        debugger;
        $scope.anItemIsSelected = false;

        if (Object.keys(selectedItems).length > 0) {
            for (var k in selectedItems) {
                if (selectedItems[k] == false) {
                    debugger;
                    delete selectedItems[k];
                } else {
                    $scope.anItemIsSelected = true;
                }
            }
        } else {
            $scope.anItemIsSelected = false;
        }
    };
    /*
     * Sort will refetch the data wit the corresponding sort params.
     */
    $scope.sort = function (col) {
        if ($scope.sort_order === col) {
            $scope.is_desc = !$scope.is_desc;
        }
        else {
            $scope.sort_order = col;
            $scope.is_desc = false;
        }
        $scope.reset();
    };

    /*
     * show_more will refetch the data wit the corresponding offset params.
     */
    $scope.show_more = function () {
        $scope.offset += $scope.limit;
        $scope.search();
    };

    /*
     * this could just be a variable, but its a method to determine
     * if the hasmore button is needed.
     */
    $scope.has_more = function () {
        return $scope.more;
    };

    /*
     * reset will reset all our search params to defaults.
     */
    $scope.reset = function () {
        $scope.limit = 20;
        $scope.offset = 0;
        $scope.items = [];
        $scope.more = true;
        $scope.search();
    };

    /*
     * Delete Group will remove a group from the groups list.
     */
    $scope.deleteGroup = function () {
        debugger;
        var id = $scope.selectedGroupForDelete;
        GroupFactory.delete({ id: id }, function () {
            $scope.getGroups();
        });
    };

    /*
     * Add Group will add a group from the groups list.  Note, selections
     * need to be made first so that we know what ec2 instances we want to
     * add to the group.
     */
    $scope.addGroup = function () {
        var checkedItems = $scope.itemsForSelection;
        var keys = [];
        
        for (var key in checkedItems) {
            if (checkedItems.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        debugger;
        var g = { Name: $scope.groupName, Members: keys.toString() }

        GroupFactory.save(g, function () {
            $scope.itemsForSelection = {};
            $scope.getGroups();
        });
    };

    /*
     * Change state will change the state property of one or more ec2instances.
     */
    $scope.changeState = function () {
        debugger;
        var isDirty = false;
        var checkedItems = $scope.itemsForSelection;
        var itemKey;
        var itemInstance;
        $scope.itemsInProcess = Object.keys(checkedItems).length;

        for (var key in checkedItems) {
            if (checkedItems.hasOwnProperty(key)) {
                itemKey = parseInt(key)
                itemInstance = getItemByID(itemKey, $scope.items);
                itemInstance.State = $scope.selectedState;
                EC2Factory.update({ id: itemInstance.ID }, itemInstance, function () {
                    $scope.itemsInProcess--;
                    if ($scope.itemsInProcess === 0)
                        $scope.reset();
                    $scope.itemsForSelection = {};
                });
            }
        }
    };

    /*
     * getItemByID is a convenience method to get the item from the array of items
     * based on its id.
     */
    function getItemByID(id, items) {
        for (i = 0; i < items.length; i++) {
            if (items[i].ID === id) {
                return items[i];
            }
        }
    }

    /*
     * changeGroupState will change the state property of an entire group
     * of ec2 instances.
     */
    $scope.changeGroupState = function () {
        var isDirty = false;
        var checkedItems = $scope.items;
        var groupInstance;
        $scope.itemsInProcess = checkedItems.length;
        for (i = 0; i < checkedItems.length;i++) {
            groupInstance = checkedItems[i];
            groupInstance.State = $scope.selectedState;
            EC2Factory.update({ id: groupInstance.ID }, groupInstance, function () {
                debugger;
                $scope.itemsInProcess--;
                if($scope.itemsInProcess === 0)
                    $scope.reset();
            });
        }
    };

    /*
     * getGroups will get the whole list of groups for the dropdown
     */
    $scope.getGroups = function () {
        $scope.groups = GroupFactory.query({}, function (data) {
        });

    };

    /*
     * The following code is to manage the modals.  We have 3:
     * ChangeState
     * DeleteGroup
     * CreateGroup
     * 
     * These will be managed by the code below.  Including 
     * updating scope variables with data taken from the modal
     * and calling controller methods to take actions based on 
     * the command.
     */
    $scope.openCreate = function (size) {
        debugger;
        if (Object.keys($scope.itemsForSelection).length > 0) {
            var modalInstance;

            modalInstance = $modal.open({
                templateUrl: 'createGroupContent.html',
                controller: 'CreateGroupCtrl',
                size: size
            });

            modalInstance.result.then(function (groupName) {
                debugger;
                $scope.groupName = groupName;
                $scope.addGroup();
                
            }, function () {
            });
        }
    };
    $scope.openRemove = function (size) {
        debugger;

        var modalInstance = $modal.open({
            templateUrl: 'removeGroupContent.html',
            controller: 'RemoveGroupCtrl',
            size: size,
            resolve: {
                items: function () {
                    return $scope.groups;
                }
            }
        });

        modalInstance.result.then(function (groupId) {
            debugger;
            $scope.selectedGroupForDelete = groupId;
            $scope.deleteGroup();
        }, function () {
        });
    };
    $scope.openChangeState = function (size) {
        debugger;
        if ((Object.keys($scope.itemsForSelection).length > 0) || isGroup) {

            var modalInstance = modelInstance = $modal.open({
                templateUrl: 'changeStateContent.html',
                controller: 'ChangeStateCtrl',
                size: size,
                resolve: {
                    items: function () {
                        return $scope.states;
                    }
                }
            });

            modalInstance.result.then(function (state) {
                debugger;
                $scope.selectedState = state;
                if (isGroup) {
                    $scope.itemsForSelection = $scope.items;
                    $scope.changeGroupState();
                } else {
                    $scope.changeState();
                }
            }, function () {
            });
        }
    };
   
    $scope.viewMessage="View All"
    $scope.getGroups();
    $scope.sort_order = 'Name';
    $scope.is_desc = false;
    $scope.states = ["pending", "terminated", "stopping", "stopped", "running", "rebooting"];
    $scope.reset();
};
angular.module('EC2Dash').controller('CreateGroupCtrl', function ($scope, $modalInstance) {

    $scope.ok = function () {
        debugger;
        $modalInstance.close($scope.groupName);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});
angular.module('EC2Dash').controller('RemoveGroupCtrl', function ($scope, $modalInstance, items) {
    $scope.groups = items;
    $scope.selectedGroupForDelete = items[0];


    $scope.ok = function () {
        debugger;
        $modalInstance.close($scope.selectedGroupForDelete.Id);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});
angular.module('EC2Dash').controller('ChangeStateCtrl', function ($scope, $modalInstance, items) {
    $scope.states = items;
    $scope.selectedState = items[0];

    $scope.ok = function () {
        debugger;
        $modalInstance.close($scope.selectedState);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});
