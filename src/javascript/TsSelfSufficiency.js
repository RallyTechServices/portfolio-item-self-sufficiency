/* global Ext */
Ext.define('TsSelfSufficiency', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'InsideStoriesFilter', type: 'auto' },
        { name: 'OutsideStoriesFilter', type: 'auto' },
        { name: 'TotalStoryCount', type: 'int', },
        { name: 'TotalPoints', type: 'int', },
        { name: 'InsideStoryCount', type: 'int', },
        { name: 'InsideStoryPoints', type: 'int', },
        { name: 'OutsideStoryCount', type: 'int', },
        { name: 'OutsideStoryPoints', type: 'int', },
        { name: 'InsideStoryCountPercent', type: 'int', },
        { name: 'InsideStoryPointsPercent', type: 'int', },
        { name: 'OutsideStoryCountPercent', type: 'int', },
        { name: 'OutsideStoryPointsPercent', type: 'int', },
        { name: 'OutsideProjectHierarchy', type: 'boolean', },
    ]
})
