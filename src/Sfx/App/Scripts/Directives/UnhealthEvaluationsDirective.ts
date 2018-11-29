//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class UnhealthyEvaluationDirective implements ng.IDirective {
        public restrict = "E";
        public replace = false;
        public controller = UnhealthyEvaluationController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/unhealthyEvaluation.html";
        public scope = {
            list: "=",
            listSettings: "=",
            displayChildren: "="
            // innerScroll: "=?"
        };
        public transclude = true;

        public link($scope: any, element: JQuery, attributes: any, ctrl: DetailListController) {
            // The list passed in can be a normal array or a DataModelCollection object.
            // When it is a normal array, the directive only updates when the list reference
            // itself is changed or any items are added/removed from the list.
            // The health events and unhealthy evaluations list references are changed
            // every time they are refreshed. That is why the contents of this directive
            // are always up-to-date.
            // When it is a DataModelCollection list, list.isRefreshing will be watched so
            // we know exactly when to refresh the list.
            $scope.$watchCollection("list", () => {
                // Only update if list is a normal array since the DataModelCollection will be updated
                // via the isRefreshing watcher below and we don't want to update the list twice.
                if ($scope.list && !angular.isDefined($scope.list.isRefreshing)) {
                    ctrl.updateList();
                }
            });

            $scope.$watch("list.isInitialized", (newVal, oldVal) => {
                // When isInitialized becomes false which means it got cleared.
                if ($scope.list && newVal === false && oldVal === true) {
                    ctrl.updateList();
                }
            });

            // Update the list every time the list has finished refreshing
            $scope.$watch("list.isRefreshing", () => {
                if ($scope.list && angular.isDefined($scope.list.isRefreshing) && !$scope.list.isRefreshing) {
                    ctrl.updateList();
                }
            });

            // Watch search keyword, the sort and filter will be controlled on view through controller
            $scope.$watch("listSettings.search", (searchText) => {
                if (searchText !== undefined) {
                    $("#sr-only-search-summary", element).attr("aria-live", "polite");
                    ctrl.updateList();
                }
            });
        }
    }


    // export class unhealthyEvaluationNodeController {
    //     public static $inject = ["$filter", "$scope"];

    //     public constructor(private $filter: angular.IFilterService, public $scope: any) {
    //     }

    //     public displayChildren(child): void {
    //     }

    // }

    export class UnhealthyEvaluationController {
        public static $inject = ["$filter", "$scope"];
        
        onlySource: boolean = true;

        public constructor(private $filter: angular.IFilterService, public $scope: any) {

        }

        public getParents(item): any[] {
            let items = new Array(0);
            while (item.parent) {
                items.push(item.parent);
                item = item.parent;
            }
            return items;
        }

        public updateList() {
            if (this.$scope.list) {
                this.$scope.events = this.getEvents(this.$scope.list);
                this.$scope.listSettings.count = this.$scope.events.length;
                this.$scope.listSettings.limit = 1;
            }
        }

        public getBadge(item: HealthEvaluation) {
            return HtmlUtils.getBadgeOnlyHtml(item.healthState);
        }

        public getLinkHtml(item: HealthEvaluation) {
            return HtmlUtils.getSpanWithLink("", item.displayName, item.viewPathUrl);
        }

        public getEvents(items: HealthEvaluation[]) {
            let events = [];
            items.forEach(element => {
                if (element.raw.Kind === "Event") {
                    const parents = this.getParents(element);
                    events.push({
                        event: element,
                        parents: parents
                    });
                    if (parents.length > 0) {
                        this.onlySource = false;
                    }
                }
            });

            return events;
        }

    }
}