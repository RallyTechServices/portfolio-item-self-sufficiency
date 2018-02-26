/* global Ext TsConstants TsMetricsMgr */
Ext.define("CArABU.app.TSApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this.addPiTypeSelector();
    },

    addPiTypeSelector: function() {
        this.add({
            xtype: 'rallyportfolioitemtypecombobox',
            fieldLabel: TsConstants.LABEL.PI_TYPE,
            labelWidth: 200,
            listeners: {
                scope: this,
                change: function(combobox, newValue) {
                    if (newValue) {
                        this.addItemSelector(combobox.getSelectedType());
                    }
                }
            }
        });
    },

    addItemSelector: function(piType) {
        if (this.itemSelector) {
            this.remove(this.itemSelector);
        }
        if (piType) {
            this.itemSelector = this.add({
                xtype: 'rallyartifactsearchcombobox',
                itemId: TsConstants.ID.SELECT_ITEM_CONTROL,
                fieldLabel: piType.get('Name'),
                labelWidth: 200,
                storeConfig: {
                    models: [piType.get('TypePath')],
                    fetch: TsConstants.FETCH.PI
                },
                listeners: {
                    scope: this,
                    change: function(combobox, newValue) {
                        return TsMetricsMgr.getSelfSufficiency(combobox.getRecord());
                    }
                }
            });
        }
    },

    getSettingsFields: function() {
        return [];
    },

    getOptions: function() {
        var options = [{
            text: 'About...',
            handler: this._launchInfo,
            scope: this
        }];

        return options;
    },

    _launchInfo: function() {
        if (this.about_dialog) { this.about_dialog.destroy(); }

        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink', {
            showLog: this.getSetting('saveLog'),
            logger: this.logger
        });
    },

    isExternal: function() {
        return typeof(this.getAppId()) == 'undefined';
    }

});
