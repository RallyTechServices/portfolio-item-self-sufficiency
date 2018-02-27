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
            layout: 'vbox',
            items: [{
                xtype: 'panel',
                itemId: 'selectLabel',
                padding: '20 20 20 20',
                width: 200,
                border: false,
                html: 'Select an item on the left...'
            }],
            region: 'center',
        }
    ],

    config: {
        defaultSettings: {
            WARNING_THRESHOLD: 80
        }
    },

    launch: function() {
        //var chartPanel = this.down('#selectLabel').center();
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
        var total = record.get('TotalStoryCount');
        chartPanel.add(this.getChart(insideProject, total, TsConstants.LABEL.BY_COUNT));

        insideProject = record.get('InDescendentProjectPoints');
        total = record.get('TotalPoints');
        chartPanel.add(this.getChart(insideProject, total, TsConstants.LABEL.BY_POINTS));
    },

    getChart: function(inside, total, title) {
        // Set a warning color if the percent inside the project is less than the warning threshold
        var setWarning = (inside / total) * 100 < this.getSetting(TsConstants.SETTING.WARNING_THRESHOLD) ? true : false;
        var pointFormatter = function() {
            return this.point.y + ' ' + this.point.name + '<br/><b>( ' + Math.round(this.point.percentage) + '% )</b>';
        };

        return {
            xtype: 'rallychart',
            loadMask: false,
            chartData: {
                series: [{
                    name: TsConstants.LABEL.PROJECT_SELF_SUFFICIENCY,
                    //colors: TsConstants.CHART.COLORS,
                    borderColor: '#000000',
                    dataLabels: {
                        formatter: pointFormatter,
                        //distance: -30
                    },
                    data: [{
                        name: TsConstants.LABEL.INSIDE_PROJECT,
                        color: TsConstants.CHART.OK,
                        y: inside,
                    }, {
                        name: TsConstants.LABEL.OUTSIDE_PROJECT,
                        color: setWarning ? TsConstants.CHART.WARNING : TsConstants.CHART.NORMAL_1,
                        y: total - inside
                    }],
                    enableMouseTracking: false
                }]
            },
            chartConfig: {
                chart: {
                    type: 'pie',
                },
                plotOptions: {
                    pie: {
                        size: '80%',
                    }
                },
                subtitle: {
                    text: TsConstants.LABEL.PROJECT_SELF_SUFFICIENCY
                },
                title: {
                    text: title
                }
            }
        }
    },

    percentRenderer: function(part, whole) {
        var result;
        if (part == undefined || whole == undefined) {
            // The metric hasn't been computed
            result = 'Loading...';
        }
        else {
            result = Math.round(part / whole * 100);
            if (isNaN(result) || !isFinite(result)) {
                result = '--';
            }
            else {
                var warningThreshold = this.getSetting(TsConstants.SETTING.WARNING_THRESHOLD);
                var classes = '';
                if (result < warningThreshold) {
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
            labelWidth: 200,
            maxValue: 100,
            minValue: 0,
            allowDecimals: false
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
