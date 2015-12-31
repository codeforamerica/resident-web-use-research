# Oakland Survey Documentation Sample
The spreadhseet associated with the Resident Research Survey Tool.
The actual survey questions are needed in this prototype but can be replaced with yout survey questions.
There are only one mandatory column that is needed for the aggregation/regression to work.

### Mandatory column
Field name | Type | Explanation
-----------|------|------------
Geographic Area|GeoJSON|The geographic area in GeoJSON to be used for finding the correct census tract.

The answers from the survey are added to the survey-page-results.html body. 
And can be changed here:

## Columns

Field name | Type | Explanation | Options
-----------|------|------------|---------
Oakland neighborhood (given)|text|Free text input which neighborhood the person indetifies as the neighborhood he/she lives in.|
OFFICE USE ONLY: neighborhood (known)|text||
Geographic Area (mandatory)|GeoJSON| The geographic area in GeoJSON to be used for finding the correct census tract.|
Age|integer| The age of the respondent.|
Language spoken at home|text| What language does the respondent speak at home. | English, Spanish, Other
Cell phone|text| What kind of Phone does the respondent use. | Android, iPhone, Windows Phone, Other Phone, No cell phone
Business owner?|bool| Is the respondent a business owner?|  Yes=1, No=0
Web on computer at home?|text| Does the respondent use the web on a computer at home? If it is filled value is anticipated|
Web on computer at work?|text| Does the respondent use the web on a computer at work? If it is filled value is anticipated|
Web on public computer?|text| Does the respondent use the web on a public computer? If it is filled value is anticipated|
Web on friend's computer?|text| Does the respondent use the web on a friend's computer? If it is filled value is anticipated|
Web on tablet Web on cell phone?|text|Does the respondent use the web on a tablet or on a cell phone? If it is filled value is anticipated|
Don't use the Web?|text|Does the respondent not use the web at all? |
Ever visited Oakland's website?|bool| Have you visited the website of the City of Oakland.| Yes=1 No=0
What were you doing?|text| Free text field.|
Get what you needed?|bool|| Yes=1 No=0
Date|date| Date of the survey response|
