describe('censusReporter', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.server = sinon.fakeServer.create();
    this.tracts = [{ geoid: 'GEO12345', feature: { properties: { aland: 1}}}]
    this.subject = ResidentResearch.censusReporter(this.tracts);
    this.data = {data: {
      'GEO12345': {
        'B03002': {
          estimate: { 'B03002012':3},  error: { 'B03002012':3},
          estimate: { 'B03002003':3},  error: { 'B03002003':3},
          estimate: { 'B03002004':3},  error: { 'B03002004':3},
          estimate: { 'B03002006':3},  error: { 'B03002006':3},
          estimate: { 'B03002001':3},  error: { 'B03002001':3}
        },
        'B01003': { estimate: {'B01003001':3}, error: {'B01003001':3}},
        'B25003': {
          estimate: { 'B25003002':3},  error: { 'B25003002':3},
          estimate: { 'B25003001':3},  error: { 'B25003001':3}
        },
        'B19013': { estimate: {'B19013001':3}, error: {'B19013001':3}},
        'B19301': { estimate: {'B19301001':3}, error: {'B19301001':3}},
      }
    }};
    this.serverResponse = [200, { "Content-Type": "application/json" }, JSON.stringify(this.data)]
  });
  afterEach(function() {
     this.server.restore();
     this.sandbox.restore();
  });
  describe('#getData', function() {
    context('server responds correctly', function() {
      beforeEach(function() {
        this.server.respondWith("GET", /.*\/data\/show\/latest\?table_ids=.*&geo_ids=.*/, this.serverResponse)
      });
      it('calls the pormise', function() {
        cb = this.sandbox.spy();
        this.subject.getData(cb);
        this.server.respond();
        expect(cb).to.have.been.calledOnce;
      });
      context('data', function() {
        it('data has the correct size', function() {
          var data;
          function cb(tracts) { data = tracts; }
          this.subject.getData(cb);
          this.server.respond();
          expect(data.length).to.eq(1)
        });
        it('data has the correct keys', function() {
          var data;
          function cb(tracts) { data = tracts; }
          this.subject.getData(cb);
          this.server.respond();
          expect(data[0]).to.have.keys(['geoid', 'feature', 'data'])
        });
        it('data has the geoid', function() {
          var data;
          function cb(tracts) { data = tracts; }
          this.subject.getData(cb);
          this.server.respond();
          expect(data[0].geoid).to.eq('GEO12345')
        });
        it('data data obj has population density', function() {
          var data;
          function cb(tracts) { data = tracts; }
          this.subject.getData(cb);
          this.server.respond();
          expect(data[0].data).to.have.any.keys(['population density'])
        });
      })
    });
    context('server returns error', function() {
      beforeEach(function() {
      serverResponse = [400, { "Content-Type": "application/json" }, '']
        this.server.respondWith("GET", /.*\/data\/show\/latest\?table_ids=.*&geo_ids=.*/, serverResponse)
      });
      it('does not call the pormise', function() {
        cb = this.sandbox.spy();
        this.server.respond();
        expect(cb).to.not.have.been.called;
      });
    });

      //expect(CensusReporter.censusResult(result, CensusReporter.populationResult)[0].data).to.have.keys(['B01003001', 'population density']);
  });
});
