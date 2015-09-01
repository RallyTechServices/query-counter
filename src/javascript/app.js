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
        var me = this;
        this.setLoading("Counting...");
        
        var artifactType = this.getSetting('counterArtifactType');
        var filters = [];
        var query = this.getSetting('counterQuery');
        
        if ( !Ext.isEmpty(query) ) {
            filters = Rally.data.wsapi.Filter.fromQueryString(query);
        }
        
        var display_box = this.down('#display_box');
        
        this._loadRecordCount(artifactType, filters).then({
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
        this.logger.log("Starting load:",model);
          
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
        this.launch();
    }
});
