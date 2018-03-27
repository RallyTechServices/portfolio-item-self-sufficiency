/* global Ext */
Ext.define('TsSelfSufficiency', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'InsideStoriesFilter', type: 'auto' },
        { name: 'OutsideStoriesFilter', type: 'auto' },
        { name: 'TotalStoryCount', type: 'int', defaultValue: 0 },
        { name: 'TotalPoints', type: 'int', defaultValue: 0 },
        { name: 'InsideStoryCount', type: 'int', defaultValue: 0 },
        { name: 'InsideStoryPoints', type: 'int', defaultValue: 0 },
        { name: 'OutsideStoryCount', type: 'int', defaultValue: 0 },
        { name: 'OutsideStoryPoints', type: 'int', defaultValue: 0 },
    ]
})
