/* global Ext _ Rally TsConstants Deft TsUtils TsSelfSufficiency */
Ext.define('TsMetricsMgr', function() {
    return {
        statics: {
            updateSelfSufficiency: updateSelfSufficiency
        }
    }

    function updateSelfSufficiency(portfolioItem) {
        if (portfolioItem) {
            var projectOid = Rally.getApp().getContext().getProject().ObjectID;
            var portfolioItemOid = portfolioItem.get('ObjectID');
            return Deft.Promise.all(
                [
                    getDescendentProjects(projectOid),
                    getAllLeafStories(portfolioItemOid)
                ]
            ).then(function(result) {
                // Build projects hash
                var projectsHash = {};
                _.forEach(result[0], function(project) {
                    projectsHash[project.get('ObjectID')] = project;
                })
                var metrics = getMetrics(projectsHash, result[1]);
                TsUtils.updateRecord(portfolioItem, metrics, TsSelfSufficiency);
            });
        }
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
            fetch: ['ObjectID'],
            autoLoad: false,
            filters: Rally.data.wsapi.Filter.or(queries),
        });

        return store.load();
    }

    function getAllLeafStories(portfolioItemOid) {
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
        var parentFilters = Rally.data.wsapi.Filter.or(parentQueries);

        var filters = new Rally.data.wsapi.Filter({
                property: 'DirectChildrenCount',
                value: 0
            })
            .and(parentFilters);

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'HierarchicalRequirement',
            context: {
                project: null
            },
            fetch: ['ObjectID', 'PlanEstimate', 'Project'],
            autoLoad: true,
            filters: filters
        });
        return store.load();
    }

    /*
    function getLeafStories(portfolioItemOid) {
        var store = Ext.create('Rally.data.lookback.SnapshotStore', {
            fetch: TsConstants.FETCH.USER_STORY,
            autoLoad: true,
            filters: [{
                    property: '_TypeHierarchy',
                    value: 'HierarchicalRequirement'
                },
                {
                    property: '_ItemHierarchy',
                    value: portfolioItemOid
                },
                {
                    property: 'DirectChildrenCount',
                    value: 0
                }
            ],
        });

        return store.load();
    }
    */

    function getMetrics(projectsHash, stories) {
        var result = _.reduce(stories, function(accumulator, story) {
            accumulator.totalCount += 1;
            accumulator.totalPoints += story.get('PlanEstimate');
            var project = story.get('Project').ObjectID
            if (projectsHash.hasOwnProperty(project)) {
                accumulator.inDescendentProjectCount += 1;
                accumulator.inDescendentProjectPoints += story.get('PlanEstimate');
            }
            return accumulator;
        }, {
            totalCount: 0,
            totalPoints: 0,
            inDescendentProjectCount: 0,
            inDescendentProjectPoints: 0,
        })

        return Ext.create('TsSelfSufficiency', {
            TotalStoryCount: result.totalCount,
            TotalPoints: result.totalPoints,
            InDescendentProjectStoryCount: result.inDescendentProjectCount,
            InDescendentProjectPoints: result.inDescendentProjectPoints
        });
    }

});
