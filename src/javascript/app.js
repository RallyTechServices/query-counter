Ext.define("TSQueryCounter", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    //defaults: { margin: '0 0 10 0' },
    items: [{
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'middle'
            },
            items: [{
                id: Utils.AncestorPiAppFilter.RENDER_AREA_ID,
                xtype: 'container',
                flex: 1,
                layout: {
                    type: 'hbox',
                    align: 'middle',
                    defaultMargins: '0 10 10 0',
                }
            }, {
                xtype: 'rallybutton',
                style: { 'float': 'right' },
                cls: 'secondary rly-small',
                frame: false,
                itemId: 'export-menu-button',
                iconCls: 'icon-export'
            }]
        },
        {
            xtype: 'container',
            itemId: 'display_box'
        }
    ],

    config: {
        defaultSettings: {
            countVariables: [{
                artifactType: 'Defect',
                query: '( ObjectID > 0 )',
                id: 'defectCount'
            }, {
                artifactType: 'HierarchicalRequirement',
                query: '( ObjectID > 0 )',
                id: 'storyCount'
            }],
            html: 'Defects: {defectCount} or Stories: {storyCount}<br/><br/><em>Use the gear to make App Settings...</em>'
        }
    },

    currentValues: [],

    launch: function() {
        var exportButton = this.down('#export-menu-button')
        exportButton.on('click', this._onExport, this);
        this._validateSettings();

        this.ancestorFilterPlugin = Ext.create('Utils.AncestorPiAppFilter', {
            ptype: 'UtilsAncestorPiAppFilter',
            pluginId: 'ancestorFilterPlugin',
            settingsConfig: {
                labelWidth: 150,
                margin: 10
            },
            listeners: {
                scope: this,
                ready: function(plugin) {
                    plugin.addListener({
                        scope: this,
                        select: function() {
                            this._runApp();
                        }
                    });
                    this._reloadModel().then({
                        scope: this,
                        success: this._runApp
                    });
                },
            }
        });
        this.addPlugin(this.ancestorFilterPlugin);
    },

    _onExport: function() {
        var csv = ["Variable Name,Value"]
        _.each(this.currentValues, function(value, key) {
            csv.push([key, value].join(','))
        });
        csv = csv.join('\r\n');
        CArABU.technicalservices.FileUtilities.saveCSVToFile(csv, 'query-counter.csv');
    },

    _validateSettings: function() {
        var cv = this._getCountVariables();
        var html = this.getSetting('html');
        this.logger.log('setting ', this.getSettings());
        var errors = [];
        Ext.Array.each(cv, function(c) {
            var variableName = Ext.String.format("{{0}}", c.id);
            var re = new RegExp(variableName);

            if (!re.exec(html)) {
                errors.push('Variable Name ' + variableName + ' not used.');
            }

        });
        if (errors.length > 0) {
            Rally.ui.notify.Notifier.showError({ message: errors.join('<br/>'), allowHTML: true });
        }
    },

    onTimeboxScopeChange: function(timebox) {
        this.callParent(arguments);
        this._runApp();
    },

    _timeboxScopeIsValidForArtifactType: function(timeboxScope, artifactType) {
        if (timeboxScope) {
            var model = this.models[artifactType];
            this.logger.log('_timeboxScopeIsValidForArtifactType', timeboxScope.getType(), model, model.getField('Milestones'), model.getField("Iteration"), model.getField("Release"), timeboxScope.getQueryFilter().toString());
            var field = "Release";
            switch (timeboxScope.getType()) {
                case 'iteration':
                    field = "Iteration";
                    break;
                case 'milestone':
                    field = "Milestones";
                    break;
            }

            if (model.getField(field)) {
                this.logger.log('TimeboxScope', timeboxScope.getType(), 'is valid for', artifactType);
                return true;
            }
            this.logger.log('TimeboxScope', timeboxScope.getType(), 'NOT valid for', artifactType);

            return false;
        }
        this.logger.log('No Timebox Scope');
        return true;
    },

    _getCountVariables: function() {
        var cv = this.getSetting('countVariables');
        if (Ext.isString(cv)) {
            cv = JSON.parse(cv);
        }
        return cv;
    },

    _getModelNames: function() {
        var countVariables = this._getCountVariables();
        this.logger.log('countVariables ', countVariables);
        var modelNames = Ext.Array.map(countVariables, function(v) {
            return v.artifactType;
        });
        return _.uniq(modelNames);
    },

    _reloadModel: function() {
        var deferred = Ext.create('Deft.Deferred');
        if (Ext.isEmpty(this._getModelNames())) {
            deferred.resolve();
        }
        //Load the model so that we can test if it is valid for the timebox scope
        Rally.data.ModelFactory.getModels({
            types: this._getModelNames(),
            scope: this,
            success: function(models) {
                this.logger.log('models ', models);
                this.models = models;
                deferred.resolve();
            }
        });
        return deferred.promise;
    },

    // There is a subtle  bug on timebox
    // scoped pages where the milestone timebox is not correctly restored after a settings change.
    // 1. Set page as milestone timebox scoped
    // 2. Pick a non-null milestone timebox
    // 3. Open app settings and save (no change needed)
    // 4. Timebox will be 'milestone' in the window.location.href instead of 'milestone/12345'.
    // See getSdkInfo() in the SDK for how the timebox is restored.
    // This only seems to occur the first time after the page is made timebox scoped and goes away once
    // the page is reloaded once.
    _runApp: function() {
        var me = this;
        var timeboxScope = this.getContext().getTimeboxScope()
        var countVariables = this._getCountVariables(),
            promises = [];

        this.logger.log('_runApp', countVariables);

        Ext.Array.each(countVariables, function(cv) {
            var artifactType = cv.artifactType,
                query = cv.query,
                id = cv.id;

            var filters = null;

            if (timeboxScope && this._timeboxScopeIsValidForArtifactType(timeboxScope, artifactType)) {
                //               me.onTimeboxScopeChange(timebox);
                filters = timeboxScope.getQueryFilter();
                this.logger.log('Using Timebox Scope >>', filters.toString(), filters);
            }

            if (!Ext.isEmpty(query)) {
                if (filters) {
                    filters = filters.and(Rally.data.wsapi.Filter.fromQueryString(query));
                }
                else {
                    filters = Rally.data.wsapi.Filter.fromQueryString(query);
                }
            }

            var ancestorFilter = this.ancestorFilterPlugin.getFilterForType(artifactType);
            if (ancestorFilter) {
                filters = filters.and(ancestorFilter);
            }
            var promise = this._loadRecordCount(artifactType, filters || [], id)

            promises.push(promise);

        }, this);

        if (promises.length > 0) {
            this.setLoading("Counting...");

            Deft.Promise.all(promises).then({
                success: this._updateDisplay,
                failure: this._showErrorNotification,
                scope: this
            }).always(function() {
                this.setLoading(false);
            }, this);
        }
        else {

            this._updateDisplay();
        }
    },

    _showErrorNotification: function(msg) {
        this.logger.log('_showErrorNotification', msg);
        Rally.ui.notify.Notifier.showError({ message: msg });
    },

    _loadRecordCount: function(model, filters, id) {
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        this.logger.log("Starting load: model >>", model, 'filters>>', filters.toString());
        var config = {
            model: model,
            filters: filters,
            limit: 1,
            pageSize: 1
        };
        if (this.searchAllProjects()) {
            config.context = {
                project: null
            };
        }

        Ext.create('Rally.data.wsapi.Store', config).load({
            callback: function(records, operation, successful) {
                var result = {};
                if (successful) {
                    me.logger.log('result:', operation);
                    result[id] = operation.resultSet.totalRecords || 0;
                    deferred.resolve(result);
                }
                else {
                    me.logger.log("Failed: ", operation);
                    result[id] = '<span class="error-counter">#ERROR: ' + operation.error.errors.join('. ') + '</span>';
                    deferred.resolve(result);
                }
            }
        });
        return deferred.promise;
    },

    _updateDisplay: function(values) {

        if (!values) { values = []; };

        values = _.reduce(values, function(obj, v) {
            obj = _.extend(obj, v);
            return obj;
        }, {});

        this.currentValues = values;

        this.logger.log('_updateDisplay', values);

        var html = this.getSetting('html'),
            tpl = new Ext.XTemplate(html);
        var display_box = this.down('#display_box');
        display_box.removeAll();
        var view = display_box.add({
            xtype: 'container',
            tpl: tpl,
            cls: 'default-counter'
        });
        view.update(values);
    },

    isExternal: function() {
        return typeof(this.getAppId()) == 'undefined';
    },

    isMilestoneScoped: function() {
        var result = false;

        var tbscope = this.getContext().getTimeboxScope();
        if (tbscope && tbscope.getType() == 'milestone') {
            result = true;
        }
        return result
    },

    searchAllProjects: function() {
        return this.ancestorFilterPlugin.getIgnoreProjectScope();
    },

    getSettingsFields: function() {
        return Rally.technicalservices.querycounter.Settings.getFields({
            width: this.getWidth()
        });
    }

});
