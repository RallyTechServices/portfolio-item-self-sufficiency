/* global Ext _ Rally TsConstants Deft TsUtils TsSelfSufficiency */
Ext.define('TsMetricsMgr', function() {
    return {
        statics: {
            setMetrics: setMetrics
        }
    }

    function loadAllData(store, accumulator) {
        // A promise that resolves with all the data (instead of just a page worth)
        if (!accumulator) {
            accumulator = [];
        }

        return store.load().then(function(results) {
            accumulator = accumulator.concat(results);
            var totalCount = store.getTotalCount();
            var loadedCount = accumulator.length;
            if (loadedCount < totalCount) {
                store._setCurrentPage(store.currentPage + 1);
                return loadAllData(store, accumulator);
            }
            else {
                store._setCurrentPage(1);
                return accumulator;
            }
        });
    }

    function setMetrics(portfolioItem) {
        if (!portfolioItem) {
            return
        }

        var projectOid = Rally.getApp().getContext().getProject().ObjectID;
        var portfolioItemOid = portfolioItem.get('ObjectID');

        return getDescendentProjects(projectOid)
            .then({
                scope: this,
                success: function(projects) {
                    var oids = _.map(projects, function(project) {
                        return project.get('ObjectID');
                    });
                    var insideStore;
                    var outsideStore;
                    var piFilter = getPiFilter(portfolioItemOid);
                    var insideStoriesFilter = getStoriesFilter(oids, true);
                    var outsideStoriesFilter = getStoriesFilter(oids, false);
                    var insideLoadPromise = getLeafStoriesStore(piFilter.and(insideStoriesFilter))
                        .then(function(store) {
                            insideStore = store;
                            return loadAllData(store);
                            //return store.load();
                        });
                    var outsideLoadPromise = getLeafStoriesStore(piFilter.and(outsideStoriesFilter))
                        .then(function(store) {
                            outsideStore = store;
                            return loadAllData(store);
                            //return store.load();
                        });
                    return Deft.Promise.all([
                        insideLoadPromise,
                        outsideLoadPromise
                    ]).then({
                        scope: this,
                        success: function(results) {
                            var insideStories = results[0];
                            var outsideStories = results[1];

                            var insideCount = insideStories.length;
                            var insidePoints = _.reduce(insideStories, function(accumulator, story) {
                                return accumulator += story.get('PlanEstimate');
                            }, 0);

                            var outsideCount = outsideStore.getTotalCount();
                            var outsidePoints = _.reduce(outsideStories, function(accumulator, story) {
                                return accumulator += story.get('PlanEstimate');
                            }, 0);

                            var metrics = Ext.create('TsSelfSufficiency', {
                                TotalStoryCount: insideCount + outsideCount,
                                TotalPoints: insidePoints + outsidePoints,
                                InsideStoryCount: insideCount,
                                InsideStoryPoints: insidePoints,
                                OutsideStoryCount: outsideCount,
                                OutsideStoryPoints: outsidePoints,
                                InsideStoriesStore: insideStore,
                                OutsideStoriesStore: outsideStore
                            });
                            TsUtils.updateRecord(portfolioItem, metrics);
                        }
                    })
                }
            });
    }

    function getDescendentProjects(projectOid) {
        var queries = _.forEach(TsUtils.getParentQueries(), function(query) {
            query.property += ".ObjectID";
            query.value = projectOid;
        });
        // Include the parent project itself
        queries.push({
            property: "ObjectID",
            value: projectOid
        })
        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'Project',
            fetch: TsConstants.FETCH.PROJECT,
            autoLoad: false,
            filters: Rally.data.wsapi.Filter.or(queries),
        });

        return store.load();
    }

    /**
     * @param projectOids leaf stories under one of these projects
     * @param inProjects (boolean) true for stories in one of the projects, false for stories NOT in one of the projects
     */
    function getStoriesFilter(projectOids, inProjects) {
        var result;
        var projectOidsQueries = _.map(projectOids, function(oid) {
            return {
                property: 'Project.ObjectID',
                operator: inProjects ? '=' : '!=',
                value: oid
            }
        });
        if (inProjects) {
            result = Rally.data.wsapi.Filter.or(projectOidsQueries);
        }
        else {
            result = Rally.data.wsapi.Filter.and(projectOidsQueries);
        }
        return result;
    }

    function getPiFilter(portfolioItemOid) {
        // TODO (tj) make this query dynamic based on defined PortfolioItemTypes
        var parentQueries = [{
                property: 'Feature.ObjectID', // Feature
                value: portfolioItemOid
            },
            {
                property: 'Feature.Parent.ObjectID', // Epic
                value: portfolioItemOid
            },
            {
                property: 'Feature.Parent.Parent.ObjectID', // Initiative
                value: portfolioItemOid
            },
            {
                property: 'Feature.Parent.Parent.Parent.ObjectID', // Theme
                value: portfolioItemOid
            },
            {
                property: 'Feature.Parent.Parent.Parent.Parent.ObjectID', // Group
                value: portfolioItemOid
            }
        ];
        return Rally.data.wsapi.Filter.or(parentQueries);
    }

    function getLeafStoriesStore(storyFilters) {
        var filters = new Rally.data.wsapi.Filter({
                property: 'DirectChildrenCount',
                value: 0
            })
            .and(storyFilters);

        return Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            model: 'HierarchicalRequirement',
            context: {
                project: null
            },
            fetch: TsConstants.FETCH.USER_STORY,
            autoLoad: false,
            enableHierarchy: false,
            filters: filters
        });
    }
});
