/* global Ext Rally */
Ext.define("TsConstants", {
    statics: {
        ID: {
            ITEM_STORE: 'ITEM_STORE',
            SELECT_ITEM_CONTROL: 'SELECT_ITEM_CONTROL'
        },
        LABEL: {
            PI_TYPE: 'Portfolio Item Type',
            WARNING_THRESHOLD: 'Minimum Desired Self-Sufficiency',
            PROJECT_SELF_SUFFICIENCY: 'Project Self-Sufficiency',
            INSIDE_PROJECT: 'Inside of Project',
            OUTSIDE_PROJECT: 'Outside of Project',
            BY_POINTS: 'Story Points',
            BY_COUNT: 'Story Count',
            SELECT_ITEM: 'Select an item on the left...'
        },
        SETTING: {
            WARNING_THRESHOLD: 'WARNING_THRESHOLD',
        },
        FETCH: {
            PI: ['Project', 'Name', 'ObjectId'],
            USER_STORY: ['PlanEstimate']
        },
        CHART: {
            WHITE: '#FFFFFF',
            OK: Ext.draw.Color.toHex('rgb(82,177,64)'),
            WARNING: Ext.draw.Color.toHex('rgb(245,88,64)'),
            NORMAL_1: Ext.draw.Color.toHex('rgb(226,226,226)'),
            NORMAL_2: Ext.draw.Color.toHex('rgb(184,184,184)'),
            COLORS: [
                Ext.draw.Color.toHex('rgb(82,177,64)'),
                Ext.draw.Color.toHex('rgb(245,88,64)')
            ]
        }
    }
});
