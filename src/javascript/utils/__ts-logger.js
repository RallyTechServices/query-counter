/*
 */
Ext.define('Rally.technicalservices.Logger', {
    enableLogging: false,
    constructor: function(config) {
        Ext.apply(this, config);
    },
    log: function(args) {
        if (this.enableLogging) {
            var timestamp = "[ " + Ext.util.Format.date(new Date(), "Y-m-d H:i:s.u") + " ]";
            //var output_args = arguments;
            //output_args.unshift( [ "[ " + timestamp + " ]" ] );
            //output_args = Ext.Array.push(output_args,arguments);

            var output_args = [];
            output_args = Ext.Array.push(output_args, [timestamp]);
            output_args = Ext.Array.push(output_args, Ext.Array.slice(arguments, 0));

            window.console && console.log.apply(console, output_args);
        }
    }

});
