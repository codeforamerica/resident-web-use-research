describe('lib', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
  });
  describe('#initial values', function() {
    it('CR_API_BASE is censusreporter', function() {
      expect(window.CR_API_BASE).to.eq('http://api.censusreporter.org/1.0');
    });
  });
});
