describe("Example test set", function() {
    it('should render the app', function() {
        var app = Rally.test.Harness.launchApp("TSQueryCounter");
        expect(app.getEl()).toBeDefined();
    });

});
