Ext.define("TSQueryCounter", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'display_box',tpl:'<tpl>{displayText}</tpl>'}
    ],
    
    config: {
        defaultSettings: {
            counterArtifactType: 'Defect',
            counterQuery: '( ObjectID > 0 )',
            counterDisplayText: '{#}<br/><em>Use the gear to make App Settings...</em>'
        }
    },
    
    launch: function() {
        this._reloadModel();
    },
    onTimeboxScopeChange: function(timebox){
        this.logger.log('onTimeboxScopeChange', timebox.getQueryFilter().toString());
        this._runApp(timebox);
    },
    _timeboxScopeIsValidForArtifactType: function(timeboxScope, artifactType){
        if (timeboxScope){
            this.logger.log('_timeboxScopeIsValidForArtifactType',timeboxScope.getType(), this.model, this.model.getField("Iteration"), this.model.getField("Release"), timeboxScope.getQueryFilter().toString());
            var field = "Release";
            if (timeboxScope.getType() == 'iteration'){
                field = "Iteration";
            }
            if (this.model.getField(field)){
                this.logger.log('TimeboxScope', timeboxScope.getType(), 'is valid for', artifactType);
                return true;
            }
            this.logger.log('TimeboxScope', timeboxScope.getType(), 'NOT valid for', artifactType);

            return false;
        }
        this.logger.log('No Timebox Scope');
        return true;
    },
    _reloadModel: function(){
        //Load the model so that we can test if it is valid for the timebox scope
        Rally.data.ModelFactory.getModel({
            type: this.getSetting('counterArtifactType'),
            scope: this,
            success: function(model) {
                this.model = model;
                this._runApp(this.getContext().getTimeboxScope());
            }
        });
    },
    _runApp: function(timeboxScope){
        var me = this;
        this.setLoading("Counting...");

        var artifactType = this.getSetting('counterArtifactType');
        var query = this.getSetting('counterQuery');

        var filters = null;
        if (timeboxScope && this._timeboxScopeIsValidForArtifactType(timeboxScope, artifactType)){
            filters = timeboxScope.getQueryFilter();
            this.logger.log('Using Timebox Scope >>', filters.toString());
        }

        if ( !Ext.isEmpty(query) ) {
            if (filters){
                filters = filters.and(Rally.data.wsapi.Filter.fromQueryString(query));
            } else {
                filters = Rally.data.wsapi.Filter.fromQueryString(query);
            }
        }

        var display_box = this.down('#display_box');

        this._loadRecordCount(artifactType, filters || []).then({
            scope: this,
            success: function(value) {
                this._updateDisplay(value);
            },
            failure: function(error_message){
                Ext.Msg.alert('Counter Problem',error_message);
            }
        }).always(function() {
            me.setLoading(false);
        });
    },
    
    _loadRecordCount: function(model, filters){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        this.logger.log("Starting load: model>>",model, 'filters>>', filters.toString());
          
        Ext.create('Rally.data.wsapi.Store', {
            model: model,
            filters: filters,
            limit: 1,
            pageSize: 1
        }).load({
            callback : function(records, operation, successful) {
                if (successful){
                    me.logger.log('result:', operation);
                    
                    var result = operation.resultSet.totalRecords || 0;
                    deferred.resolve(result);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject("Couldn't Load: " + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    _updateDisplay: function(value){
        this.logger.log('_updateDisplay',value);
        var display_string = this.getSetting('counterDisplayText').replace(/\{#}/,value);
        
        this.down('#display_box').update(display_string);
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{
            informationHtml: "Record Type: " + this.getSetting('counterArtifactType') 
                + "<br/>With Query: " + this.getSetting('counterQuery') + "<br/>"
        });
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    getSettingsFields: function() {
        return Rally.technicalservices.querycounter.Settings.getFields();
    },
        
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
//        Ext.apply(this, settings);
        this._runApp();
    }
});
