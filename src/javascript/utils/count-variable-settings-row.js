Ext.define('CountVariableSettingsRow', {
        alias: 'widget.countvariablesettingsrow',
        extend: 'Ext.Container',

        layout: 'hbox',
        cls: 'advanced-filter-row',
        config: {
            variableName: undefined,
            artifactType: undefined,
            query: undefined,
            addButtonEnabled: false,
            removeButtonEnabled: false
        },

        constructor: function(config) {
            this.mergeConfig(config);
            this.callParent([this.config]);
        },

      initComponent: function() {
          this.items = this._getItems();
          this.callParent(arguments);
          // this.on('boxready', function() {
          //     //this.indexLabel.el.show();
          //     // if (this.focusPropertyField) {
          //     //     this.propertyField.focus();
          //     // }
          // }, this, {single: true});
      },

      _getItems: function() {

        this._createAddRowButton();

        if (!this.isEmpty){
          this._createRemoveRowButton();
          this._createIdField();
          this._createArtifactTypeField();
          this._createQueryField();

          var ct = Ext.widget({
            xtype: 'container',
            layout: 'vbox',
            height: 112,
            flex: 1,
            items: [
              this.idField,
              this.artifactTypeField,
              this.queryField
            ]
          });

          return [
            this.addRowButton,
            this.removeRowButton,
            ct
          ];
        }

        return [
            this.addRowButton
        ];

      },
      getVariableName: function(){ return this.idField.getValue();},
      getArtifactType: function(){ return this.artifactTypeField.getValue();},
      getQuery: function(){ return this.queryField.getValue();},
      disableAddRow: function() {
        this.addRowButton.addCls('variable-button-disabled');
        this.addRowButton.disable();
      },

      disableRemoveRow: function() {
        this.removeRowButton.addCls('variable-button-disabled');
        this.removeRowButton.disable();
      },
      enableRemoveRow: function() {
        this.removeRowButton.removeCls('variable-button-disabled');
        this.removeRowButton.enable();
      },
      enableAddRow: function() {
        this.addRowButton.removeCls('variable-button-disabled');
        this.addRowButton.enable();
      },

      isValid: function() {
          return !!this.idField.getValue() && !!this.artifactTypeField.getValue() && this.queryField.validate();
      },
      validate: function(){
         if (!this.idField.getValue()){ return "Please provide a value for the Variable Name.";}
         if (!this.artifactTypeField.getValue()){ return "Please provide a value for the Artifact Type."}
         if (!this.queryField.getValue()){ return "Please provide a query."}

         var queryValid = this.queryField.validate();
         if (!queryValid){ return "Invalid Query."};

         return null;
      },
      getCountVariable: function(){
          if (this.isValid()){
              var id = this.idField.getValue(),
                  artifactType = this.artifactTypeField.getValue(),
                  query = this.queryField.getValue();

              return {
                 id: id,
                 artifactType: artifactType,
                 query: query
              };
          }
      },

      _createIdField: function(){
          this.idField = Ext.widget({
              xtype: 'rallytextfield',
              itemId: 'idField',
              width: '100%',
              labelAlign:'right',
            //  labelCls: 'variable-label',
              fieldLabel: 'Variable Name',
              labelSeparator: '',
              emptyText: 'Unique Variable Name...',
              value: this.variableName,
              margin: '2 0 2 0',
              validateOnBlur: true,
              validator: function(val){
                 return val && val.length > 0;
              },
              getErrors: function(val){
                 if (!val || val.trim().length == 0){
                   return ["Please provide a value for Variable Name"]
                 }
                 return [];
              },
              listeners: {
                validitychange: function(cb,isValid){
                  this.fireEvent('rowvalidate',this);
                },
               scope: this
              }
          });
      },

      _createArtifactTypeField: function(){
        this.artifactTypeField = Ext.widget({
            xtype: 'tsrecordtypecombobox',
            itemId: 'artifactTypeField',
            width: '100%',

            labelAlign: 'right',
            fieldLabel: 'Artifact Type',
            labelSeparator: '',
          //  labelCls: 'variable-label',
            margin: '2 0 2 0',
            emptyText: 'Choose Artifact Type...',
            value: this.artifactType,
            valueField: 'TypePath',
            displayField: 'Name',
            validateOnBlur: true,
            validateOnChange: true,
            validator: function(val){
               return val && val.length > 0;
            },
            listeners: {
                validitychange: function(cb,isValid){
                  this.fireEvent('rowvalidate',this);
                },
               scope: this
            }
        });
      },

    _createQueryField: function(){
        this.queryField = Ext.widget({
          xtype: 'textarea',
          fieldLabel: null,
          width: '100%',

          labelAlign: 'right',
          labelSeparator: '',
          //labelCls: 'variable-label',
          fieldLabel: 'Query',
          margin: '2 0 2 0',
          flex: 1,
          name: 'counterQuery',
          //anchor: '100%',
          cls: 'query-field',
        //  margin: '0 70 0 0',
          plugins: [
            // {
            //   ptype: 'rallyhelpfield',
            //   helpId: 194
            // },
            'rallyfieldvalidationui'
          ],
          emptyText: 'Type a Rally Query like ( ObjectID > 0 )...',
          value: this.query || "(ObjectID > 0)",
          validateOnBlur: true,
          validateOnChange: false,
          validator: function(value) {
            if (!value){ return "Query is required."; }
            try {
              if (value) {
                Rally.data.wsapi.Filter.fromQueryString(value);
              }
              return true;
            } catch (e) {
              return e.message;
            }
          },
          listeners: {
              validitychange: function(){
                this.fireEvent('rowvalidate',this);
              },
             scope: this
          }
        });
    },

    _createAddRowButton: function() {
        var addRowCls = 'variable-button-disabled';
        if (this.addButtonEnabled){
           addRowCls = '';
        }

        this.addRowButton =  Ext.widget({
            xtype: 'rallybutton',
            itemId: 'addRowButton',
            //userAction: 'Add filter row clicked',
            cls: 'rly-small icon-plus filter-row-control variable-button ' + addRowCls,
            margin: 5,
            border: 0,
            disabled: !this.addButtonEnabled,
            listeners: {
                click: this._addRow,
                buffer: 200,
                scope: this
            }
        });
    },

    _createRemoveRowButton: function() {
        this.removeRowButton = Ext.widget({
            xtype: 'rallybutton',
            itemId: 'removeRowButton',
            //userAction: 'Remove filter row clicked',
            cls: 'rly-small icon-minus filter-row-control variable-button',
            border: 0,
            margin: 5,
            disabled: false,
            listeners: {
                click: this._removeRow,
                buffer: 200,
                scope: this
            }
        });
    },
    _addRow: function() {
        this.fireEvent('addrow', this);
    },

    _removeRow: function(autoFocus) {
        this.fireEvent('removerow', this, {autoFocus: autoFocus !== false });
    },

});
