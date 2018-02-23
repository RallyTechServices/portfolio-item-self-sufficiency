/* global Ext _ Rally */
Ext.define('TsMetricsMgr', function() {
    return {
        statics: {
            getSelfSufficiency: getSelfSufficiency
        }
    }

    function getSelfSufficiency(portfolioItem) {
        var projectOid = portfolioItem.get('Project').ObjectID;
        return getDescendentProjects(projectOid);
    }

    function getDescendentProjects(projectOid) {
        var queries = _.forEach(getParentQueries(), function(query) {
            query.property += ".ObjectID";
            query.value = projectOid;
        });
        Ext.create('Rally.data.wsapi.Store', {
            model: 'Project',
            autoLoad: true,
            filters: Rally.data.wsapi.Filter.or(queries),
            listeners: {
                load: function(store, data, success) {
                    console.log(data);
                }
            }
        });
    }

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

});
