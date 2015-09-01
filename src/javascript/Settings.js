Ext.define('Rally.technicalservices.querycounter.Settings', {
    singleton: true,

    getFields: function(config) {
        
        var items = [];
        
        items.push({
            name: 'counterArtifactType',
            xtype: 'tsrecordtypecombobox',
            margin: '10px 0 0 0',
            fieldLabel: 'Record Type',
            valueField: 'TypePath',
            readyEvent: 'ready' 
        });
        
        items.push({
            xtype: 'textarea',
            fieldLabel: 'Query',
            name: 'counterQuery',
            anchor: '100%',
            cls: 'query-field',
            margin: '0 70 0 0',
            plugins: [
                {
                    ptype: 'rallyhelpfield',
                    helpId: 194
                },
                'rallyfieldvalidationui'
            ],
            validateOnBlur: false,
            validateOnChange: false,
            validator: function(value) {
                try {
                    if (value) {
                        Rally.data.wsapi.Filter.fromQueryString(value);
                    }
                    return true;
                } catch (e) {
                    return e.message;
                }
            }
        });
        
        items.push({
            xtype:'container',
            html:'Display Text<br/><span style="color:#999999;"><i>Use {#} to place the results of the count.</i></span>'
        });
        
        items.push({
            name:'counterDisplayText',
            xtype:'rallyrichtexteditor',
            margin: '10 70 0 80',
            fieldLabel: 'Informational Text'
        });
        

        return items;
    }
});