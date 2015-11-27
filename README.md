Resident Web Use Research [![Build Status](https://travis-ci.org/codeforamerica/resident-web-use-research.svg?branch=code-coverage)](https://travis-ci.org/codeforamerica/resident-web-use-research) [![Coverage Status](https://coveralls.io/repos/codeforamerica/resident-web-use-research/badge.svg?branch=master&service=github)](https://coveralls.io/github/codeforamerica/resident-web-use-research?branch=master) [![Code Climate](https://codeclimate.com/github/codeforamerica/resident-web-use-research/badges/gpa.svg)](https://codeclimate.com/github/codeforamerica/resident-web-use-research)
=========================

This _work-in-progress_ survey tool will make it easy to run, evaluate, and course-correct resident research surveys
of internet use. Code for America has developed this process
[as parts of its Digital Front Door initiative](http://www.codeforamerica.org/our-work/initiatives/digitalfrontdoor/),
and included the results
[in our Oakland Phase 1 Report](http://www.codeforamerica.org/our-work/initiatives/digitalfrontdoor/oakland-phase1-report/):

* [Resident survey results](http://www.codeforamerica.org/our-work/initiatives/digitalfrontdoor/oakland-phase1-report/#resident-survey-results)
  showing channels of internet access.

    > We believe that mobile-primary users are significantly under-represented in our sample, at least if the most reliable available national statistics are correct.

* [Geography process](http://www.codeforamerica.org/our-work/initiatives/digitalfrontdoor/oakland-phase1-report/#geography-process)
  describing how we correlated self-reported neighborhoods to Census geography.

    > We asked each participant “What Oakland neighborhood do you live in?,” and allowed free-text responses so respondents could accurately describe their location. Values ranged all widely, from close matches to CEDA-defined neighborhood names, to council districts, zip codes, and large areas like “East Oakland.”

Technology
----------

We are using a combination of data from [Census Reporter’s](http://censusreporter.org) API for
[ACS 5-year data](http://www.census.gov/acs/www/), Google Docs for survey data storage,
[TypeForm](http://www.typeform.com) for survey response gathering, and probably
[Turf.js](http://turfjs.org) and [Leaflet](http://leafletjs.com) for map display.

There will probably be a back-end written in
[Python](https://github.com/codeforamerica/howto/blob/master/Python-Virtualenv.md)
and [Flask](http://flask.pocoo.org).

Oakland analysis from October 2014 [can be found in `analysis-oakland-2014-10-27`](analysis-oakland-2014-10-27).

Help Wanted
-----------

We’ll be formalizing a few _help wanted_ issues in the coming weeks:

1. Survey setup, connection between TypeForm and Google Docs,
   [likely via Zapier](https://zapier.com/app/editor/3368724).
2. Ways for residents to identify their location on a map without pinpointing it.
   Neighborhoods or tract groups would be best; zip codes are not sufficiently granular.
3. Visual representation of in-progress results with race/ethnicity/income correlations.

Percentage of Oakland population Hispanic or Latino, 2010 Census:

![Percentage of population Hispanic or Latino](http://www.codeforamerica.org/our-work/initiatives/digitalfrontdoor/oakland-phase1-report/assets/map-4.png)
