/* global Ext TsConstants TsMetricsMgr _ */
Ext.define("CArABU.app.TSApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: 'border',
    items: [{
            xtype: 'panel',
            itemId: 'navigationPanel',
            padding: '0 0 10 0',
            bodyPadding: 5,
            split: true,
            width: "50%",
            region: 'west'
        },
        {
            xtype: 'panel',
            itemId: 'chartPanel',
            split: true,
            region: 'center'
        }
    ],

    config: {
        defaultSettings: {
            WARNING_THRESHOLD: 80
        }
    },

    launch: function() {
        this.addPiTypeSelector();
    },

    addPiTypeSelector: function() {
        var navPanel = this.down('#navigationPanel');
        navPanel.add({
            xtype: 'rallyportfolioitemtypecombobox',
            fieldLabel: TsConstants.LABEL.PI_TYPE,
            labelWidth: 150,
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
        if (piType) {
            Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
                models: [piType.get('TypePath')],
                autoLoad: true,
                enableHierarchy: true
            }).then({
                scope: this,
                success: function(store) {
                    var navPanel = this.down('#navigationPanel');
                    if (this.itemSelector) {
                        navPanel.remove(this.itemSelector);
                    }
                    this.itemSelector = navPanel.add({
                        items: [{
                            xtype: 'rallytreegrid',
                            columnCfgs: [
                                'Name',
                                'Project',
                                {
                                    text: 'Self-Sufficiency By Story Count',
                                    dataIndex: 'ObjectID',
                                    sortable: false,
                                    scope: this,
                                    renderer: function(value, meta, record) {
                                        var part = record.get('InDescendentProjectStoryCount');
                                        var whole = record.get('TotalStoryCount');
                                        return this.percentRenderer(part, whole);
                                    }
                                },
                                {
                                    text: 'Self-Sufficiency By Story Points',
                                    dataIndex: 'ObjectID',
                                    sortable: false,
                                    scope: this,
                                    renderer: function(value, meta, record) {
                                        var part = record.get('InDescendentProjectPoints');
                                        var whole = record.get('TotalPoints');
                                        return this.percentRenderer(part, whole);
                                    }
                                }
                            ],
                            enableBulkEdit: false,
                            enableColumnHide: true,
                            enableColumnMove: true,
                            enableColumnResize: true,
                            enableEditing: false,
                            enableInlineAdd: false,
                            enableRanking: false,
                            shouldShowRowActionsColumn: false,
                            store: store,
                            fetch: ['ObjectID'],
                            listeners: {
                                scope: this,
                                load: function(store, node, records) {
                                    _.forEach(records, function(record) {
                                        TsMetricsMgr.updateSelfSufficiency(record);
                                    })
                                },
                                itemclick: function(tree, record) {
                                    this.drawCharts(record);
                                }
                            }
                        }],
                    });
                }
            });
        }
    },

    drawCharts: function(record) {
        var chartPanel = this.down('#chartPanel');
        chartPanel.removeAll();

        var insideProject = record.get('InDescendentProjectStoryCount');
        var outsideProject = record.get('TotalStoryCount') - record.get('InDescendentProjectStoryCount');
        var data = [];
        if (outsideProject) {
            data.push({
                name: TsConstants.LABEL.OUTSIDE_PROJECT,
                data: outsideProject
            })
        }
        if (insideProject) {
            data.push({
                name: TsConstants.LABEL.INSIDE_PROJECT,
                data: insideProject
            });
        }
        var store = Ext.create('Ext.data.JsonStore', {
            fields: ['name', 'data'],
            data: data
        });
        chartPanel.add(this.getChartConfig(store, TsConstants.LABEL.BY_COUNT));

        insideProject = record.get('InDescendentProjectPoints');
        outsideProject = record.get('TotalPoints') - record.get('InDescendentProjectPoints');
        data = [];
        if (outsideProject) {
            data.push({
                name: TsConstants.LABEL.OUTSIDE_PROJECT,
                data: outsideProject
            })
        }
        if (insideProject) {
            data.push({
                name: TsConstants.LABEL.INSIDE_PROJECT,
                data: insideProject
            });
        }
        store = Ext.create('Ext.data.JsonStore', {
            fields: ['name', 'data'],
            data: data
        });
        chartPanel.add(this.getChartConfig(store, TsConstants.LABEL.BY_POINTS));
    },

    getChartConfig: function(store, title) {
        return {
            xtype: 'chart',
            title: title,
            width: 300,
            height: 300,
            store: store,
            legend: true,
            theme: 'Base:gradients',
            series: [{
                type: 'pie',
                angleField: 'data',
                label: {
                    field: 'name',
                    display: 'inside',
                    contrast: true
                },
                colorSet: TsConstants.CHART.COLORS
            }],
        }
    },

    percentRenderer: function(part, whole) {
        var result;
        if (part == undefined || whole == undefined) {
            // The metric hasn't been computed
            result = 'Loading...';
        }
        /*
        else if (whole == 0) {
            // There is no total value, don't render a 0
            result = '--';
        }*/
        else {
            result = Math.round(part / whole * 100);
            if (isNaN(result) || !isFinite(result)) {
                result = '--';
            }
            else {
                var warningThreshold = this.getSetting(TsConstants.SETTING.WARNING_THRESHOLD);
                var classes = '';
                if (result <= warningThreshold) {
                    classes = 'caution'
                }
                result = '<div class="' + classes + '">' + result + '%</div>';
            }
        }
        return result;
    },

    getSettingsFields: function() {
        return [{
            xtype: 'rallynumberfield',
            name: TsConstants.SETTING.WARNING_THRESHOLD,
            label: TsConstants.LABEL.WARNING_THRESHOLD,
            labelWidth: 200
        }];
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
