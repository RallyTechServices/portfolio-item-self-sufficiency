/* global Ext _ Rally TsConstants Deft TsUtils TsSelfSufficiency */
Ext.define('TsMetricsMgr', function() {
    return {
        statics: {
            setMetrics: setMetrics
        }
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
                    var piFilter = getPiFilter(portfolioItemOid);
                    var insideStoriesFilter = getStoriesFilter(oids, true);
                    var outsideStoriesFilter = getStoriesFilter(oids, false)
                    var insideStoriesStore = getLeafStoriesStore(piFilter.and(insideStoriesFilter));
                    var outsideStoriesStore = getLeafStoriesStore(piFilter.and(outsideStoriesFilter));
                    return Deft.Promise.all([
                        insideStoriesStore.load(),
                        outsideStoriesStore.load()
                    ]).then({
                        scope: this,
                        success: function(results) {
                            var insidePoints = insideStoriesStore.sum('PlanEstimate');
                            var outsidePoints = outsideStoriesStore.sum('PlanEstimate');

                            var metrics = Ext.create('TsSelfSufficiency', {
                                TotalStoryCount: insideStoriesStore.getTotalCount() + outsideStoriesStore.getTotalCount(),
                                TotalPoints: insidePoints + outsidePoints,
                                InsideStoryCount: insideStoriesStore.getTotalCount(),
                                InsideStoryPoints: insidePoints,
                                OutsideStoryCount: outsideStoriesStore.getTotalCount(),
                                OutsideStoryPoints: outsidePoints,
                                InsideStoriesStore: insideStoriesStore,
                                OutsideStoriesStore: outsideStoriesStore
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

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'HierarchicalRequirement',
            context: {
                project: null
            },
            fetch: TsConstants.FETCH.USER_STORY,
            autoLoad: true,
            filters: filters
        });
        return store;
    }
});
