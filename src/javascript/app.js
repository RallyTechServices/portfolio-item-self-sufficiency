/* global Ext TsConstants TsMetricsMgr _ */
Ext.define("CArABU.app.TSApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: 'border',
    items: [{
            xtype: 'panel',
            itemId: TsConstants.ID.SELECTION_AREA,
            padding: '0 0 10 0',
            autoScroll: true,
            bodyPadding: 5,
            split: true,
            width: "50%",
            region: 'west'
        },
        {
            xtype: 'tabpanel',
            itemId: TsConstants.ID.RESULTS_AREA,
            items: [{
                xtype: 'panel',
                itemId: TsConstants.ID.SUMMARY_PANEL,
                title: TsConstants.LABEL.SUMMARY_PANEL,
                autoScroll: true,
                layout: 'vbox',
                items: [{
                    xtype: 'panel',
                    itemId: 'selectLabel',
                    padding: '20 20 20 20',
                    width: 200,
                    border: false,
                    html: 'Select an item on the left...'
                }],
            }, {
                xtype: 'panel',
                itemId: TsConstants.ID.DETAILS_PANEL,
                title: TsConstants.LABEL.DETAILS_PANEL,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                autoScroll: true,
                items: [{
                    xtype: 'panel',
                    itemId: 'selectLabel',
                    padding: '20 20 20 20',
                    width: 200,
                    border: false,
                    html: 'Select an item on the left...'
                }]
            }],
            region: 'center',
        },
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
        var navPanel = this.down('#' + TsConstants.ID.SELECTION_AREA);
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
                fetch: TsConstants.FETCH.PI,
                autoLoad: true,
                enableHierarchy: true
            }).then({
                scope: this,
                success: function(store) {
                    var navPanel = this.down('#' + TsConstants.ID.SELECTION_AREA);
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
                                        var part = record.get('InsideStoryCount');
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
                                        var part = record.get('InsideStoryPoints');
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
                            shouldShowRowActionsColumn: true,
                            store: store,
                            fetch: ['ObjectID'],
                            listeners: {
                                scope: this,
                                load: function(store, node, records) {
                                    _.forEach(records, function(record) {
                                        TsMetricsMgr.setMetrics(record);
                                    })
                                },
                                itemclick: function(tree, record) {
                                    // TODO (tj) prevent charts and details until stories data done loading
                                    this.addCharts(record);
                                    this.addDetails(record);
                                }
                            }
                        }],
                    });
                }
            });
        }
    },

    addCharts: function(record) {
        var summaryPanel = this.down('#' + TsConstants.ID.SUMMARY_PANEL);
        summaryPanel.removeAll();

        var insideProject = record.get('InsideStoryCount');
        var total = record.get('TotalStoryCount');
        summaryPanel.add(this.getChart(insideProject, total, TsConstants.LABEL.BY_COUNT));

        insideProject = record.get('InsideStoryPoints');
        total = record.get('TotalPoints');
        summaryPanel.add(this.getChart(insideProject, total, TsConstants.LABEL.BY_POINTS));
    },

    addDetails: function(record) {
        var detailsPanel = this.down('#' + TsConstants.ID.DETAILS_PANEL);
        detailsPanel.removeAll();

        var columnCfgs = [
            'FormattedID',
            'Name',
            {
                title: "Sched",
                dataIndex: 'ScheduleState'
            },
            'Owner',
            'Project',
            'Feature'
        ];

        detailsPanel.add({
            xtype: 'rallygrid',
            title: TsConstants.LABEL.OUTSIDE_PROJECT + ' (' + record.get('OutsideStoryCount') + ')',
            store: record.get('OutsideStoriesStore'),
            columnCfgs: columnCfgs,
            collapsible: true,
            flex: 1,
            showPagingToolbar: false,
        });

        detailsPanel.add({
            xtype: 'rallygrid',
            title: TsConstants.LABEL.INSIDE_PROJECT + ' (' + record.get('InsideStoryCount') + ')',
            store: record.get('InsideStoriesStore'),
            columnCfgs: columnCfgs,
            collapsible: true,
            flex: 1,
            showPagingToolbar: false
        });
    },

    getChart: function(inside, total, title) {
        // Set a warning color if the percent inside the project is less than the warning threshold
        var setWarning = (inside / total) * 100 < this.getSetting(TsConstants.SETTING.WARNING_THRESHOLD) ? true : false;
        var pointFormatter = function() {
            return this.point.y + ' ' + this.point.name + '<br/><b>( ' + Math.round(this.point.percentage) + '% )</b>';
        };
        var self = this;
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
                    tooltip: {
                        followPointer: false,
                        pointFormat: 'Click for details'
                    },
                    point: {
                        events: {
                            click: self.onChartClick.bind(self)
                        }
                    },
                    enableMouseTracking: true
                }]
            },
            chartConfig: {
                chart: {
                    type: 'pie',
                    height: "400",
                },
                plotOptions: {
                    pie: {
                        size: '75%',
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

    onChartClick: function() {
        // Switch to details view
        this.down('#' + TsConstants.ID.RESULTS_AREA).setActiveTab(TsConstants.ID.DETAILS_PANEL);
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
