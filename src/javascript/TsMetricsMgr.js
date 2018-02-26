/* global Ext _ Rally TsConstants Deft */
Ext.define('TsMetricsMgr', function() {
    return {
        statics: {
            getSelfSufficiency: getSelfSufficiency
        }
    }

    function getSelfSufficiency(portfolioItem) {
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
                return getMetrics(projectsHash, result[1]);
            });
        }
    }

    function getDescendentProjects(projectOid) {
        var queries = _.forEach(getParentQueries(), function(query) {
            query.property += ".ObjectID";
            query.value = projectOid;
        });
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

    function getParentQueries() {
        return _.map(_.range(1, 10), function(depth) {
            var result = [];
            while (depth-- > 0) {
                result.push("Parent")
            }
            return {
                property: result.join('.')
            }
        });
    }

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

        return result;
    }

});
