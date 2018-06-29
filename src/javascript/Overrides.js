Ext.override(Rally.data.wsapi.TreeStore, {
    _decorateModels: function() {
        var models = this.model;

        // Must add it to composite model otherwise any column with a dataIndex will be excluded
        this.addExtraFields(models);

        if (_.isFunction(models.getArtifactComponentModels)) {
            models = models.getArtifactComponentModels();
        }

        Ext.Array.each(models, function(m) {
            if (m.typePath.indexOf("portfolioitem/") != -1) {
                this.addExtraFields(m)
            }
        }, this);
        _.each(Ext.Array.from(models), Rally.ui.grid.data.NodeInterface.decorate, Rally.ui.grid.data.NodeInterface);
    },

    addExtraFields: function(model) {
        model.addField({
            name: 'InsideStoryCountPercent',
            type: 'int',
            defaultValue: undefined,
            modelType: model.typePath, // TODO (tj) modelType used anywhere?
            getUUID: function() { // Must include a getUUID function for state save/restore to work
                return this.name;
            }
        });
        model.addField({
            name: 'OutsideStoryCountPercent',
            type: 'int',
            defaultValue: undefined,
            modelType: model.typePath, // TODO (tj) modelType used anywhere?
            getUUID: function() { // Must include a getUUID function for state save/restore to work
                return this.name;
            }
        });
        model.addField({
            name: 'InsideStoryPointsPercent',
            type: 'int',
            defaultValue: undefined,
            modelType: model.typePath, // TODO (tj) modelType used anywhere?
            getUUID: function() { // Must include a getUUID function for state save/restore to work
                return this.name;
            }
        });
        model.addField({
            name: 'OutsideStoryPointsPercent',
            type: 'int',
            defaultValue: undefined,
            modelType: model.typePath, // TODO (tj) modelType used anywhere?
            getUUID: function() { // Must include a getUUID function for state save/restore to work
                return this.name;
            }
        });
    }
});
