/* global Ext */
Ext.define("TsConstants", {
    statics: {
        ID: {
            ITEM_STORE: 'ITEM_STORE',
            SELECT_ITEM_CONTROL: 'SELECT_ITEM_CONTROL'
        },
        LABEL: {
            PI_TYPE: 'Portfolio Item Type',
            WARNING_THRESHOLD: 'Minimum Desired Self-Sufficiency',
            INSIDE_PROJECT: 'In Project',
            OUTSIDE_PROJECT: 'Out of Project',
            BY_POINTS: 'By Story Points',
            BY_COUNT: 'By Story Count'
        },
        SETTING: {
            WARNING_THRESHOLD: 'WARNING_THRESHOLD',
        },
        FETCH: {
            PI: ['Project', 'Name', 'ObjectId'],
            USER_STORY: ['PlanEstimate']
        },
        CHART: {
            COLORS: ['#FAD200', '#FFFFFF']
        }
    }
});
