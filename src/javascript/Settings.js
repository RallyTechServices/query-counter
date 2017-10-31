Ext.define('Rally.technicalservices.querycounter.Settings', {
    singleton: true,

    getFields: function(config) {

        var items = [];

        items.push({
          name:'countVariables',
          fieldLabel: null,
          labelAlign: 'top',
          xtype:'countvariablesettings',
          height: 350,
          width: config.width * .90 || 600,
          margin: 10
        });

        items.push({
            xtype:'container',
            margin: '10 70 0 60',
            html:'<div class="variable-label">Display Text</div><span style="color:#999999;">Enter the text to display in the App.  Use the format of <b>{&lt;Variable Name&gt;}</b> to place the results of the count queries defined above.</span>'
        });

        items.push({
            name:'html',
            xtype:'rallyrichtexteditor',
            margin: '10 70 0 60',
            fieldLabel: 'Informational Text',
            height: 200
        });
        return items;
    }
});
