/* global Ext */
Ext.define('TsSelfSufficiency', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'InsideDescendentProjectStories', type: 'auto' },
        { name: 'OutsideDescendentProjectStories', type: 'auto' },
        { name: 'TotalStoryCount', type: 'int', defaultValue: 0 },
        { name: 'TotalPoints', type: 'int', defaultValue: 0 },
        { name: 'InDescendentProjectStoryCount', type: 'int', defaultValue: 0 },
        { name: 'InDescendentProjectPoints', type: 'int', defaultValue: 0 },
    ]
})
