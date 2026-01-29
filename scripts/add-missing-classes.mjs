#!/usr/bin/env node
/**
 * Add Missing Classes to the Mapping
 *
 * This script adds frequently-encountered uncategorized classes
 * directly to the class-to-category.json mapping.
 */

import { readFileSync, writeFileSync } from 'fs';

const mappingPath = new URL('../src/lib/data/class-to-category.json', import.meta.url);
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

// Classes identified from analysis that need to be added
// Round 2: More classes from second analysis pass
const ADDITIONAL_CLASSES_ROUND2 = {
  // === GOVERNMENT/POLITICS (elections) ===
  'Q16939528': 'Government', // general election in Malta (42x)
  'Q1128324': 'Government',  // European Parliament election (32x)
  'Q2618461': 'Government',  // election
  'Q3068523': 'Government',  // European Parliament election in a country
  'Q14006248': 'Government',  // election in France
  'Q327765': 'Government',   // election in Germany
  'Q918346': 'Government',   // election in the United Kingdom
  'Q2991470': 'Government',  // election in Greece
  'Q126456312': 'Government', // EP election in Denmark
  'Q126456824': 'Government', // EP election in France
  'Q126456703': 'Government', // EP election in Germany
  'Q126456904': 'Government', // EP election in the UK
  'Q25041813': 'Government', // EP election in Greece
  'Q17037962': 'Government', // off-year EP election
  'Q858439': 'Government',   // election
  'Q40231': 'Government',    // election
  'Q30461': 'Government',    // president
  'Q484416': 'Government',   // prime minister

  // === SCIENCE/TECHNOLOGY (vehicles, cameras, taxonomy) ===
  'Q19832486': 'Science',    // locomotive class (36x)
  'Q20741022': 'Science',    // digital camera model (24x)
  'Q811704': 'Science',      // rolling stock class (20x)
  'Q20679033': 'Science',    // digital camera product line (5x)
  'Q29048322': 'Science',    // vehicle model
  'Q334166': 'Science',      // rail vehicle type
  'Q20888659': 'Science',    // camera model
  'Q62008942': 'Science',    // digital camera
  'Q740752': 'Science',      // transport company
  'Q1305580': 'Science',     // transport undertaking
  'Q427626': 'Science',      // taxonomic rank (3x)
  'Q3100180': 'Science',     // rank in botany (3x)
  'Q13578154': 'Science',    // rank in zoology (3x)
  'Q10753560': 'Science',    // scientific name (3x)
  'Q4120621': 'Science',     // taxonomy term
  'Q82799': 'Science',       // name
  'Q1969448': 'Science',     // term
  'Q488677': 'Science',      // genus-differentia definition
  'Q1026899': 'Science',     // definition
  'Q5962346': 'Science',     // classification scheme (6x)
  'Q6423319': 'Science',     // classification
  'Q12775893': 'Science',    // knowledge organization system
  'Q4117139': 'Science',     // biological database (2x)
  'Q1391125': 'Science',     // database organization
  'Q62809234': 'Science',    // red list (2x)
  'Q2352616': 'Science',     // conservation status
  'Q172839': 'Science',      // photographic process (3x)
  'Q1439691': 'Science',     // photographic technique
  'Q193395': 'Science',      // photographic material

  // === ARTS/ENTERTAINMENT ===
  'Q759853': 'Arts',         // film format (7x)
  'Q322481': 'Arts',         // film type
  'Q2085518': 'Arts',        // media format
  'Q82036085': 'Arts',       // image format
  'Q6293': 'Arts',           // photographic film (3x)
  'Q1439598': 'Arts',        // photography
  'Q96792464': 'Arts',       // film (material)
  'Q373899': 'Arts',         // record chart (11x)
  'Q80793969': 'Arts',       // music chart
  'Q1364556': 'Arts',        // music award (3x)
  'Q107655869': 'Arts',      // group of awards (3x)
  'Q16887380': 'Arts',       // award ceremony
  'Q133250': 'Arts',         // award
  'Q66715801': 'Arts',       // musical profession (3x)
  'Q135106813': 'Arts',      // creative profession
  'Q106043376': 'Arts',      // music release type (2x)
  'Q59913930': 'Arts',       // release type
  'Q135236697': 'Arts',      // Enumeration of 200 (chart)
  'Q4025884': 'Arts',        // enumeration

  // === SPORTS ===
  'Q26132862': 'Sports',     // Olympic sports discipline event (13x)
  'Q51031626': 'Sports',     // sports discipline competition
  'Q96679888': 'Sports',     // Olympic event
  'Q107151225': 'Sports',    // European U23 Judo Championships (4x)
  'Q929905': 'Sports',       // judo competition
  'Q11346238': 'Sports',     // European Junior Judo Championships (2x)
  'Q3329729': 'Sports',      // IJF World Tour Tbilisi
  'Q16680753': 'Sports',     // IJF World Tour Turkey
  'Q31629': 'Sports',        // type of sport (2x)
  'Q135408445': 'Sports',    // men's national association football team (2x)
  'Q61766585': 'Sports',     // men's football team
  'Q103229495': 'Sports',    // national football team representation

  // === CULTURE (buildings, institutions) ===
  'Q24354': 'Culture',       // theatre building (5x)
  'Q57660343': 'Culture',    // performance venue
  'Q2310313': 'Culture',     // cultural institution
  'Q114961210': 'Culture',   // cultural venue
  'Q811102': 'Culture',      // type of building (4x)
  'Q21146257': 'Culture',    // type
  'Q117023459': 'Culture',   // institution type

  // === SOCIETY ===
  'Q249556': 'Society',      // railway company (2x)
  'Q17377208': 'Society',    // railway undertaking (2x)
  'Q13417114': 'Society',    // noble family (3x)
  'Q8436': 'Society',        // family
  'Q1642895': 'Society',     // extended family

  // === HISTORY (military, awards) ===
  'Q193622': 'History',      // order (decoration) (3x)
  'Q131383086': 'History',   // SS rank (3x)
  'Q15983795': 'History',    // military rank
  'Q428661': 'History',      // U-boat (3x)
  'Q2811': 'History',        // submarine
  'Q177597': 'History',      // warship type

  // === EDUCATION ===
  'Q112872396': 'Education', // type of educational institution (2x)
};

const ADDITIONAL_CLASSES = {
  // === ARTS (paintings, music, films, etc.) ===
  'Q3305213': 'Arts',       // painting (62x)
  'Q105543609': 'Arts',     // musical work/composition (61x)
  'Q134556': 'Arts',        // single (music) (20x)
  'Q215380': 'Arts',        // musical group (11x)
  'Q15416': 'Arts',         // television program (5x)
  'Q641066': 'Arts',        // girl band (6x)
  'Q110295396': 'Arts',     // type of musical instrument (6x)
  'Q1573906': 'Arts',       // concert tour (6x)
  'Q18127': 'Arts',         // record label (5x)
  'Q11060274': 'Arts',      // print (artwork) (5x)
  'Q47461344': 'Arts',      // written work (4x)
  'Q18218093': 'Arts',      // etching print (3x)
  'Q860861': 'Arts',        // sculpture (3x)
  'Q2188189': 'Arts',       // musical work (parent class)
  'Q15621286': 'Arts',      // intellectual work
  'Q838948': 'Arts',        // work of art (parent)
  'Q108346082': 'Arts',     // musical release (parent of single)
  'Q7302866': 'Arts',       // music release (parent)
  'Q2491498': 'Arts',       // pop group
  'Q5741069': 'Arts',       // rock band
  'Q2497298': 'Arts',       // k-pop group
  'Q215048': 'Arts',        // band
  'Q2198855': 'Arts',       // duo (music)
  'Q56816954': 'Arts',      // musical artist
  'Q753110': 'Arts',        // songwriter
  'Q177220': 'Arts',        // singer
  'Q36834': 'Arts',         // composer
  'Q488205': 'Arts',        // singer-songwriter
  'Q639669': 'Arts',        // musician
  'Q55960': 'Arts',         // opera
  'Q34379': 'Arts',         // musical instrument
  'Q1344': 'Arts',          // opera house
  'Q153562': 'Arts',        // orchestra
  'Q207628': 'Arts',        // composition for orchestra
  'Q874429': 'Arts',        // symphony
  'Q1641839': 'Arts',       // concerto
  'Q27939': 'Arts',         // singing
  'Q207556': 'Arts',        // concert
  'Q1259917': 'Arts',       // music video
  'Q5398426': 'Arts',       // television series
  'Q15773317': 'Arts',      // television series episode
  'Q21191270': 'Arts',      // television series season
  'Q1259759': 'Arts',       // music album
  'Q169930': 'Arts',        // EP (extended play)
  'Q1665658': 'Arts',       // studio album
  'Q209939': 'Arts',        // live album
  'Q222910': 'Arts',        // compilation album
  'Q56823454': 'Arts',      // rock album
  'Q212879': 'Arts',        // drawing
  'Q4502142': 'Arts',       // visual artwork
  'Q191067': 'Arts',        // article (publication)
  'Q591041': 'Arts',        // academic journal
  'Q5633421': 'Arts',       // scientific journal (3x)
  'Q2085381': 'Arts',       // publishing house (4x)
  'Q685935': 'Arts',        // trade magazine
  'Q41298': 'Arts',         // magazine
  'Q1002697': 'Arts',       // periodical
  'Q5194627': 'Arts',       // comics series
  'Q1004': 'Arts',          // comic book
  'Q8274': 'Arts',          // manga
  'Q21198342': 'Arts',      // anime television series

  // === SCIENCE (diseases, biology, chemistry, etc.) ===
  'Q15056993': 'Science',   // aircraft family (50x)
  'Q15056995': 'Science',   // aircraft model (10x)
  'Q112193867': 'Science',  // class of disease (20x)
  'Q12136': 'Science',      // disease (11x)
  'Q112826905': 'Science',  // class of anatomical entity (4x)
  'Q112965645': 'Science',  // symptom or sign (4x)
  'Q929833': 'Science',     // rare disease (3x)
  'Q2996394': 'Science',    // biological process
  'Q2057971': 'Science',    // health condition
  'Q105688774': 'Science',  // infectious disease
  'Q18123741': 'Science',   // autoimmune disease
  'Q169872': 'Science',     // symptom
  'Q11173': 'Science',      // chemical compound
  'Q79529': 'Science',      // chemical substance
  'Q12140': 'Science',      // medication
  'Q35456': 'Science',      // medicine
  'Q8386': 'Science',       // drug
  'Q22999537': 'Science',   // vehicle family
  'Q29048322': 'Science',   // vehicle model
  'Q11436': 'Science',      // aircraft
  'Q17517': 'Science',      // airplane
  'Q697175': 'Science',     // helicopter
  'Q752392': 'Science',     // military aircraft
  'Q210932': 'Science',     // airliner
  'Q177456': 'Science',     // fighter aircraft
  'Q1229765': 'Science',    // bomber
  'Q3041792': 'Science',    // anatomical structure
  'Q4936952': 'Science',    // anatomical entity
  'Q712378': 'Science',     // organ
  'Q14860489': 'Science',   // cell type
  'Q420927': 'Science',     // protein family
  'Q28885102': 'Science',   // pharmaceutical product

  // === SPORTS ===
  'Q27020041': 'Sports',    // sports season (19x)
  'Q23905105': 'Sports',    // women's national association football team (8x)
  'Q623109': 'Sports',      // sports league (5x)
  'Q6979593': 'Sports',     // national association football team (5x)
  'Q912165': 'Sports',      // football at the Pan American Games (4x)
  'Q4611891': 'Sports',     // association football position (6x)
  'Q10688145': 'Sports',    // sports competition edition
  'Q13406554': 'Sports',    // sports season by participant
  'Q114609228': 'Sports',   // football competition edition
  'Q8031011': 'Sports',     // women's football team
  'Q28140340': 'Sports',    // female association football team
  'Q1194951': 'Sports',     // national sports team
  'Q15944511': 'Sports',    // national football team
  'Q1781513': 'Sports',     // sports position
  'Q1478437': 'Sports',     // football at a multi-sport event
  'Q7129601': 'Sports',     // event at multi-sport competition
  'Q18608583': 'Sports',    // sports organization
  'Q4438121': 'Sports',     // sport league organization
  'Q1752939': 'Sports',     // sports venue
  'Q41323': 'Sports',       // Olympic Games
  'Q82414': 'Sports',       // World Cup
  'Q17156793': 'Sports',    // sporting event
  'Q847017': 'Sports',      // sports club
  'Q476028': 'Sports',      // association football club
  'Q2067461': 'Sports',     // football match
  'Q2536513': 'Sports',     // international football competition

  // === SOCIETY (companies, organizations, etc.) ===
  'Q891723': 'Society',     // public company (7x)
  'Q46970': 'Society',      // airline (6x)
  'Q18043413': 'Society',   // supermarket chain (4x)
  'Q35127': 'Society',      // website (7x)
  'Q7094076': 'Society',    // online database (4x)
  'Q1403556': 'Society',    // reference management software (17x)
  'Q7397': 'Society',       // software (5x)
  'Q4830453': 'Society',    // business enterprise
  'Q783794': 'Society',     // company
  'Q6881511': 'Society',    // enterprise
  'Q134161': 'Society',     // joint-stock company
  'Q658255': 'Society',     // startup
  'Q1875615': 'Society',    // transport operator
  'Q180846': 'Society',     // supermarket
  'Q132777643': 'Society',  // retail chain
  'Q1076968': 'Society',    // web application
  'Q1714118': 'Society',    // social networking service
  'Q19967801': 'Society',   // online service
  'Q8513': 'Society',       // database
  'Q3427877': 'Society',    // website type
  'Q17537576': 'Society',   // creative work
  'Q12774177': 'Society',   // digital work
  'Q21198342': 'Society',   // digital content
  'Q28640': 'Society',      // profession (4x)
  'Q12737077': 'Society',   // occupation

  // === HISTORY (wars, protests, historical events) ===
  'Q273120': 'History',     // protest (5x)
  'Q17524420': 'History',   // aspect of history (5x)
  'Q37726': 'History',      // army (3x)
  'Q1190554': 'History',    // occurrence (3x)
  'Q67518978': 'History',   // historical occurrence
  'Q1914636': 'History',    // political event
  'Q180684': 'History',     // conflict
  'Q8473': 'History',       // military organization
  'Q176799': 'History',     // military unit
  'Q1047113': 'History',    // specialty

  // === GEOGRAPHY ===
  'Q74817647': 'Geography', // aspect in a geographic region (31x)
  'Q34442': 'Geography',    // road (5x)
  'Q21040055': 'Geography', // aspect of something
  'Q1322323': 'Geography',  // transport infrastructure
  'Q113519195': 'Geography', // linear feature
  'Q83620': 'Geography',    // path
  'Q54050': 'Geography',    // hill
  'Q8502': 'Geography',     // mountain
  'Q4022': 'Geography',     // river
  'Q23397': 'Geography',    // lake
  'Q34038': 'Geography',    // waterfall
  'Q39816': 'Geography',    // valley
  'Q35509': 'Geography',    // cave
  'Q180874': 'Geography',   // glacier
  'Q39594': 'Geography',    // peninsula
  'Q40080': 'Geography',    // beach
  'Q3215290': 'Geography',  // neighbourhood
  'Q5084': 'Geography',     // hamlet
  'Q5119': 'Geography',     // capital city
  'Q1549591': 'Geography',  // big city
  'Q1093829': 'Geography',  // city in the US

  // === GOVERNMENT/POLITICS ===
  'Q20667921': 'Government', // type of French administrative division (4x)
  'Q15617994': 'Government', // designation for administrative unit
  'Q4164871': 'Government', // position (4x)
  'Q214339': 'Government',  // post
  'Q294414': 'Government',  // public office
  'Q4175034': 'Government', // head of government

  // === EDUCATION ===
  'Q189533': 'Education',   // academic degree (3x)
  'Q4218455': 'Education',  // academic title
  'Q618779': 'Education',   // award
  'Q427581': 'Education',   // honor

  // === CULTURE ===
  'Q4828724': 'Culture',    // aviation museum (3x)
  'Q2516357': 'Culture',    // museum type
  'Q33506': 'Culture',      // museum
  'Q207694': 'Culture',     // art museum
  'Q575727': 'Culture',     // science museum
  'Q17431399': 'Culture',   // ethnographic museum

  // === LANGUAGE ===
  'Q121493639': 'Language', // name particle (5x)
  'Q10856962': 'Language',  // anthroponymy
  'Q13196193': 'Language',  // affix
  'Q184943': 'Language',    // suffix
  'Q134830': 'Language',    // prefix
  'Q101352': 'Language',    // surname

  // === LAW ===
  'Q10541491': 'Law',       // legal form (3x)
  'Q16889133': 'Law',       // class
  'Q5127848': 'Law',        // classification system

  // === SKIP (Wikimedia internal) ===
  // Q13406463: Wikimedia list article - don't add, not useful for game
  // Q12139612: Wikimedia project page type
  // Q15138389: Wikimedia disambiguation page
  // Q17442446: Wikimedia-internal class
};

console.log('=== Adding Missing Classes ===\n');
console.log(`Current mapping size: ${Object.keys(mapping).length} classes`);

let added = 0;
let alreadyExists = 0;

// Add round 2 classes first
for (const [classId, category] of Object.entries(ADDITIONAL_CLASSES_ROUND2)) {
  if (mapping[classId]) {
    alreadyExists++;
  } else {
    mapping[classId] = category;
    added++;
  }
}

// Add original classes
for (const [classId, category] of Object.entries(ADDITIONAL_CLASSES)) {
  if (mapping[classId]) {
    alreadyExists++;
  } else {
    mapping[classId] = category;
    added++;
  }
}

console.log(`Classes already in mapping: ${alreadyExists}`);
console.log(`New classes added: ${added}`);
console.log(`New mapping size: ${Object.keys(mapping).length} classes\n`);

// Write updated mapping
writeFileSync(mappingPath, JSON.stringify(mapping));
console.log(`Updated ${mappingPath.pathname}`);

// Category distribution
const categoryCount = {};
for (const cat of Object.values(mapping)) {
  categoryCount[cat] = (categoryCount[cat] || 0) + 1;
}

console.log('\nCategory distribution:');
const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
for (const [cat, count] of sorted) {
  console.log(`  ${cat}: ${count}`);
}

console.log('\nDone! Run test-random-100.mjs to verify improved coverage.');
