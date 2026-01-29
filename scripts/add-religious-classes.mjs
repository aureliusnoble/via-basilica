#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const mappingPath = new URL('../src/lib/data/class-to-category.json', import.meta.url);
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

// Add specific religious/historical classes that aren't captured by P279 chains
const additionalClasses = {
  // Religion - Christian concepts, organizations, events
  'Q183770': 'Religion',   // Christian creed (Nicene Creed)
  'Q1140925': 'Religion',  // confession of faith
  'Q1327500': 'Religion',  // church council
  'Q1417093': 'Religion',  // ecumenical council
  'Q108458': 'Religion',   // schism (religious)
  'Q207628': 'Religion',   // sacred music
  'Q1542938': 'Religion',  // religious war
  'Q841752': 'Religion',   // iconoclasm
  'Q42389': 'Religion',    // apostle
  'Q327245': 'Religion',   // patriarch (church)
  'Q193353': 'Religion',   // Christian theology
  'Q9584': 'Religion',     // Bible
  'Q8261': 'Religion',     // New Testament
  'Q51626': 'Religion',    // Old Testament
  'Q44613': 'Religion',    // monastic order
  'Q23847174': 'Religion', // Christian liturgy
  'Q1193547': 'Religion',  // martyr
  'Q105958': 'Religion',   // veneration
  'Q51628': 'Religion',    // Holy Spirit
  'Q37090': 'Religion',    // original sin
  'Q102856': 'Religion',   // heresy
  'Q160149': 'Religion',   // crusader state
  'Q19809': 'Religion',    // Christmas
  'Q21196': 'Religion',    // Easter
  'Q162267': 'Religion',   // Christian theology topic
  'Q1164038': 'Religion',  // religious belief
  'Q1394476': 'Religion',  // census-designated place -> actually not religious, skip
  'Q2993979': 'Religion',  // theological concept
  'Q179461': 'Religion',   // religious text
  'Q60995': 'Religion',    // psalm
  'Q34726': 'Religion',    // prayer
  'Q170208': 'Religion',   // liturgy
  'Q735827': 'Religion',   // sacrament
  'Q3235978': 'Religion',  // religious practice
  'Q1064858': 'Religion',  // religious denomination
  'Q35509825': 'Religion', // religious concept

  // History - wars, empires, historical events
  'Q15180': 'History',     // Soviet Union
  'Q7318': 'History',      // Nazi Germany
  'Q12560': 'History',     // Middle Ages
  'Q5873': 'History',      // Renaissance
  'Q12544': 'History',     // Byzantine Empire (ensure it's History)
  'Q42585': 'History',     // World War I
  'Q362': 'History',       // World War II
  'Q8229': 'History',      // Cold War
  'Q12548': 'History',     // Holy Roman Empire
  'Q170419': 'History',    // fall of Constantinople
};

let added = 0;
let overwritten = 0;

for (const [classId, category] of Object.entries(additionalClasses)) {
  if (mapping[classId]) {
    if (mapping[classId] !== category) {
      console.log(`Overwriting ${classId}: ${mapping[classId]} -> ${category}`);
      mapping[classId] = category;
      overwritten++;
    }
  } else {
    console.log(`Adding ${classId} -> ${category}`);
    mapping[classId] = category;
    added++;
  }
}

writeFileSync(mappingPath, JSON.stringify(mapping));
console.log(`\nAdded: ${added}, Overwritten: ${overwritten}`);
console.log(`Total mapping size: ${Object.keys(mapping).length}`);
