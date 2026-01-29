#!/usr/bin/env node
/**
 * Build Pre-computed Wikidata Class Mapping
 *
 * This script queries Wikidata SPARQL endpoint to get all subclasses
 * of our target categories and builds a mapping file for instant lookups.
 *
 * Run with: node scripts/build-class-mapping.mjs
 * Output: src/lib/data/class-to-category.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
// Output to edge function directory (used at runtime)
const OUTPUT_PATH = new URL('../supabase/functions/check-article-categories/class-to-category.json', import.meta.url).pathname;

// Target classes for each category
// These are the root classes whose subclasses we'll fetch
// Note: Limit parameter controls max subclasses per target to keep file size manageable
// Expanded extensively for better coverage in Wikipedia navigation game
const TARGET_CLASSES = [
  // ===========================================
  // GEOGRAPHY - human settlements, territories, natural features
  // ===========================================
  { id: 'Q486972', category: 'Geography', label: 'human settlement', limit: 8000 },
  { id: 'Q56061', category: 'Geography', label: 'administrative territorial entity', limit: 8000 },
  { id: 'Q15642541', category: 'Geography', label: 'human-geographic territorial entity', limit: 5000 },
  { id: 'Q82794', category: 'Geography', label: 'geographic region', limit: 5000 },
  { id: 'Q35145263', category: 'Geography', label: 'natural geographic object', limit: 3000 },
  { id: 'Q46831', category: 'Geography', label: 'mountain range', limit: 1000 },
  { id: 'Q23442', category: 'Geography', label: 'island', limit: 2000 },
  { id: 'Q165', category: 'Geography', label: 'sea', limit: 500 },
  { id: 'Q4022', category: 'Geography', label: 'river', limit: 2000 },
  { id: 'Q8502', category: 'Geography', label: 'mountain', limit: 2000 },
  { id: 'Q23397', category: 'Geography', label: 'lake', limit: 1500 },
  { id: 'Q39816', category: 'Geography', label: 'valley', limit: 1000 },
  { id: 'Q185113', category: 'Geography', label: 'plateau', limit: 500 },
  { id: 'Q34763', category: 'Geography', label: 'peninsula', limit: 500 },
  { id: 'Q54050', category: 'Geography', label: 'hill', limit: 1000 },
  { id: 'Q355304', category: 'Geography', label: 'watercourse', limit: 1500 },
  { id: 'Q15324', category: 'Geography', label: 'body of water', limit: 2000 },
  { id: 'Q6256', category: 'Geography', label: 'country', limit: 1000 },
  { id: 'Q3624078', category: 'Geography', label: 'sovereign state', limit: 500 },
  { id: 'Q107390', category: 'Geography', label: 'federated state', limit: 1000 },
  { id: 'Q1093829', category: 'Geography', label: 'city-state', limit: 200 },
  { id: 'Q93352', category: 'Geography', label: 'coast', limit: 500 },

  // ===========================================
  // PEOPLE - human beings and person types
  // ===========================================
  { id: 'Q5', category: 'People', label: 'human', limit: 5000 },
  { id: 'Q215627', category: 'People', label: 'person', limit: 3000 },
  { id: 'Q36180', category: 'People', label: 'writer', limit: 2000 },
  { id: 'Q82955', category: 'People', label: 'politician', limit: 2000 },
  { id: 'Q901', category: 'People', label: 'scientist', limit: 2000 },
  { id: 'Q483501', category: 'People', label: 'artist', limit: 2000 },
  { id: 'Q33999', category: 'People', label: 'actor', limit: 1500 },
  { id: 'Q639669', category: 'People', label: 'musician', limit: 1500 },
  { id: 'Q177220', category: 'People', label: 'singer', limit: 1500 },
  { id: 'Q2066131', category: 'People', label: 'athlete', limit: 2000 },
  { id: 'Q2259451', category: 'People', label: 'cleric', limit: 1000 },
  { id: 'Q42603', category: 'People', label: 'priest', limit: 1000 },
  { id: 'Q43845', category: 'People', label: 'businessperson', limit: 1000 },
  { id: 'Q47064', category: 'People', label: 'military personnel', limit: 1500 },
  { id: 'Q1028181', category: 'People', label: 'painter', limit: 1000 },
  { id: 'Q15632617', category: 'People', label: 'fictional human', limit: 1000 },
  { id: 'Q4271324', category: 'People', label: 'mythical character', limit: 1000 },
  { id: 'Q189290', category: 'People', label: 'military officer', limit: 1500 },
  { id: 'Q333634', category: 'People', label: 'translator', limit: 500 },
  { id: 'Q170790', category: 'People', label: 'mathematician', limit: 1000 },
  { id: 'Q39631', category: 'People', label: 'physician', limit: 1000 },
  { id: 'Q185351', category: 'People', label: 'jurist', limit: 1000 },
  { id: 'Q1622272', category: 'People', label: 'university teacher', limit: 1000 },
  { id: 'Q10800557', category: 'People', label: 'film actor', limit: 1000 },
  { id: 'Q4964182', category: 'People', label: 'philosopher', limit: 1000 },
  { id: 'Q40348', category: 'People', label: 'lawyer', limit: 1000 },
  { id: 'Q81096', category: 'People', label: 'engineer', limit: 1000 },
  { id: 'Q13382576', category: 'People', label: 'nobility', limit: 1500 },
  { id: 'Q2478141', category: 'People', label: 'aristocrat', limit: 1000 },
  { id: 'Q22808320', category: 'People', label: 'monarch', limit: 1000 },
  { id: 'Q116', category: 'People', label: 'monarch (position)', limit: 500 },

  // ===========================================
  // RELIGION - core for saint game
  // ===========================================
  { id: 'Q9174', category: 'Religion', label: 'religion', limit: 8000 },
  { id: 'Q1530022', category: 'Religion', label: 'religious organization', limit: 3000 },
  { id: 'Q24398318', category: 'Religion', label: 'religious building', limit: 3000 },
  { id: 'Q1841533', category: 'Religion', label: 'religious text', limit: 1000 },
  { id: 'Q3220391', category: 'Religion', label: 'religious concept', limit: 1000 },
  { id: 'Q1068640', category: 'Religion', label: 'deity', limit: 1000 },
  { id: 'Q16970', category: 'Religion', label: 'church building', limit: 2000 },
  { id: 'Q120560', category: 'Religion', label: 'basilica', limit: 500 },
  { id: 'Q44539', category: 'Religion', label: 'temple', limit: 1500 },
  { id: 'Q15877', category: 'Religion', label: 'abbey', limit: 500 },
  { id: 'Q160742', category: 'Religion', label: 'monastery', limit: 1000 },
  { id: 'Q9238344', category: 'Religion', label: 'religious movement', limit: 1000 },
  { id: 'Q12131', category: 'Religion', label: 'religious denomination', limit: 1500 },
  { id: 'Q1185588', category: 'Religion', label: 'religious doctrine', limit: 1000 },
  { id: 'Q1244922', category: 'Religion', label: 'religious order', limit: 1000 },
  { id: 'Q178706', category: 'Religion', label: 'institution', limit: 1500 },
  { id: 'Q179723', category: 'Religion', label: 'canonization', limit: 200 },
  { id: 'Q185085', category: 'Religion', label: 'feast day', limit: 500 },
  { id: 'Q150093', category: 'Religion', label: 'crypt', limit: 200 },
  { id: 'Q47280', category: 'Religion', label: 'pilgrimage', limit: 300 },
  { id: 'Q14756018', category: 'Religion', label: 'religious festival', limit: 500 },
  { id: 'Q1539016', category: 'Religion', label: 'religious profession', limit: 1000 },
  { id: 'Q1643657', category: 'Religion', label: 'religious concept', limit: 1000 },
  { id: 'Q1128969', category: 'Religion', label: 'religious sacrament', limit: 300 },
  { id: 'Q232932', category: 'Religion', label: 'heresy', limit: 500 },
  { id: 'Q1414816', category: 'Religion', label: 'religious syncretism', limit: 200 },
  { id: 'Q2915731', category: 'Religion', label: 'religious service', limit: 500 },
  { id: 'Q3469507', category: 'Religion', label: 'Christian denomination', limit: 1500 },
  { id: 'Q7755', category: 'Religion', label: 'schism', limit: 300 },
  { id: 'Q1047607', category: 'Religion', label: 'relic', limit: 300 },
  { id: 'Q34651', category: 'Religion', label: 'patriarch', limit: 500 },
  { id: 'Q41710', category: 'Religion', label: 'ethnic religion', limit: 500 },
  { id: 'Q3502482', category: 'Religion', label: 'religious community', limit: 1000 },
  { id: 'Q23847174', category: 'Religion', label: 'prayer', limit: 500 },
  { id: 'Q33104279', category: 'Religion', label: 'religious practice', limit: 500 },
  { id: 'Q2142152', category: 'Religion', label: 'sacred site', limit: 500 },

  // ===========================================
  // HISTORY - expanded significantly for saint game
  // ===========================================
  { id: 'Q13418847', category: 'History', label: 'historical event', limit: 2000 },
  { id: 'Q11514315', category: 'History', label: 'historical period', limit: 1500 },
  { id: 'Q48349', category: 'History', label: 'empire', limit: 500 },
  { id: 'Q198', category: 'History', label: 'war', limit: 2000 },
  { id: 'Q178561', category: 'History', label: 'battle', limit: 2000 },
  { id: 'Q8016240', category: 'History', label: 'historical country', limit: 2000 },
  { id: 'Q164950', category: 'History', label: 'revolution', limit: 500 },
  { id: 'Q3024240', category: 'History', label: 'historical administrative territorial entity', limit: 1500 },
  { id: 'Q159821', category: 'History', label: 'rebellion', limit: 500 },
  { id: 'Q180684', category: 'History', label: 'conflict', limit: 1500 },
  { id: 'Q124757', category: 'History', label: 'coup d\'état', limit: 300 },
  { id: 'Q8486', category: 'History', label: 'coronation', limit: 200 },
  { id: 'Q12323', category: 'History', label: 'annexation', limit: 200 },
  { id: 'Q625994', category: 'History', label: 'peace treaty', limit: 500 },
  { id: 'Q131569', category: 'History', label: 'treaty', limit: 1000 },
  { id: 'Q8473', category: 'History', label: 'military operation', limit: 1000 },
  { id: 'Q216380', category: 'History', label: 'crusade', limit: 200 },
  { id: 'Q192909', category: 'History', label: 'chronicle', limit: 500 },
  { id: 'Q625298', category: 'History', label: 'historical document', limit: 500 },
  { id: 'Q3055118', category: 'History', label: 'historical organization', limit: 1000 },
  { id: 'Q36279', category: 'History', label: 'dynasty', limit: 500 },
  { id: 'Q417175', category: 'History', label: 'succession', limit: 300 },
  { id: 'Q5633421', category: 'History', label: 'historical event', limit: 1500 },
  { id: 'Q1366112', category: 'History', label: 'patriciate', limit: 300 },
  { id: 'Q839954', category: 'History', label: 'archaeological site', limit: 1500 },
  { id: 'Q10864048', category: 'History', label: 'ancient history', limit: 500 },
  { id: 'Q11768', category: 'History', label: 'plague', limit: 300 },
  { id: 'Q2596997', category: 'History', label: 'historical occupation', limit: 1000 },
  { id: 'Q1480166', category: 'History', label: 'historical science', limit: 500 },
  { id: 'Q751876', category: 'History', label: 'siege', limit: 500 },
  { id: 'Q28640', category: 'History', label: 'profession', limit: 2000 },
  { id: 'Q1004996', category: 'History', label: 'historical title', limit: 500 },
  { id: 'Q1004', category: 'History', label: 'historical military unit', limit: 1000 },
  { id: 'Q8575586', category: 'History', label: 'military unit', limit: 1500 },
  { id: 'Q35509', category: 'History', label: 'archaeological period', limit: 500 },

  // ===========================================
  // SCIENCE & TECHNOLOGY
  // ===========================================
  { id: 'Q11862829', category: 'Science', label: 'academic discipline', limit: 3000 },
  { id: 'Q16521', category: 'Science', label: 'taxon', limit: 2000 },
  { id: 'Q523', category: 'Science', label: 'star', limit: 1000 },
  { id: 'Q318', category: 'Science', label: 'galaxy', limit: 500 },
  { id: 'Q2915354', category: 'Science', label: 'disease', limit: 2000 },
  { id: 'Q12136', category: 'Science', label: 'disease', limit: 2000 },
  { id: 'Q11173', category: 'Science', label: 'chemical compound', limit: 1500 },
  { id: 'Q11344', category: 'Science', label: 'chemical element', limit: 200 },
  { id: 'Q12140', category: 'Science', label: 'medication', limit: 1000 },
  { id: 'Q39546', category: 'Science', label: 'tool', limit: 1500 },
  { id: 'Q28640', category: 'Science', label: 'profession', limit: 1500 },
  { id: 'Q12739', category: 'Science', label: 'scientific journal', limit: 500 },
  { id: 'Q47528', category: 'Science', label: 'research institute', limit: 1000 },
  { id: 'Q7397', category: 'Science', label: 'software', limit: 1500 },
  { id: 'Q386724', category: 'Science', label: 'work of science', limit: 1000 },
  { id: 'Q618779', category: 'Science', label: 'award', limit: 1500 },
  { id: 'Q17737', category: 'Science', label: 'theory', limit: 1000 },

  // ===========================================
  // ARTS - film, music, literature, visual arts
  // ===========================================
  { id: 'Q11424', category: 'Arts', label: 'film', limit: 2000 },
  { id: 'Q482994', category: 'Arts', label: 'album', limit: 1000 },
  { id: 'Q7366', category: 'Arts', label: 'song', limit: 1500 },
  { id: 'Q5398426', category: 'Arts', label: 'television series', limit: 1000 },
  { id: 'Q7725634', category: 'Arts', label: 'literary work', limit: 5000 },
  { id: 'Q7889', category: 'Arts', label: 'video game', limit: 1500 },
  { id: 'Q134556', category: 'Arts', label: 'single (music)', limit: 500 },
  { id: 'Q15416', category: 'Arts', label: 'television program', limit: 1000 },
  { id: 'Q3305213', category: 'Arts', label: 'painting', limit: 1500 },
  { id: 'Q17537576', category: 'Arts', label: 'creative work', limit: 2000 },
  { id: 'Q2188189', category: 'Arts', label: 'musical work', limit: 1500 },
  { id: 'Q860861', category: 'Arts', label: 'sculpture', limit: 1000 },
  { id: 'Q21191270', category: 'Arts', label: 'television episode', limit: 500 },
  { id: 'Q11090', category: 'Arts', label: 'album', limit: 1000 },
  { id: 'Q105543609', category: 'Arts', label: 'musical composition', limit: 1000 },
  { id: 'Q1569167', category: 'Arts', label: 'fiction character', limit: 2000 },
  { id: 'Q15773347', category: 'Arts', label: 'theatrical work', limit: 1000 },
  { id: 'Q5185279', category: 'Arts', label: 'poem', limit: 500 },
  { id: 'Q47461344', category: 'Arts', label: 'literary work', limit: 1500 },
  { id: 'Q105420', category: 'Arts', label: 'animation', limit: 500 },
  { id: 'Q93184', category: 'Arts', label: 'short film', limit: 500 },
  { id: 'Q1107', category: 'Arts', label: 'anime', limit: 500 },
  { id: 'Q21198342', category: 'Arts', label: 'manga series', limit: 500 },

  // ===========================================
  // SPORTS
  // ===========================================
  { id: 'Q349', category: 'Sports', label: 'sport', limit: 5000 },
  { id: 'Q476028', category: 'Sports', label: 'football club', limit: 500 },
  { id: 'Q847017', category: 'Sports', label: 'sports club', limit: 1000 },
  { id: 'Q18536594', category: 'Sports', label: 'sports competition', limit: 1000 },
  { id: 'Q16510064', category: 'Sports', label: 'sporting event', limit: 1500 },
  { id: 'Q4498974', category: 'Sports', label: 'sports season', limit: 1000 },
  { id: 'Q31629', category: 'Sports', label: 'sports league', limit: 500 },
  { id: 'Q483110', category: 'Sports', label: 'stadium', limit: 1000 },
  { id: 'Q13406463', category: 'Sports', label: 'sports competition result', limit: 500 },
  { id: 'Q115157', category: 'Sports', label: 'championship', limit: 1000 },
  { id: 'Q7930614', category: 'Sports', label: 'sports venue', limit: 1000 },
  { id: 'Q27020041', category: 'Sports', label: 'sports competition', limit: 1000 },
  { id: 'Q2464301', category: 'Sports', label: 'national sports team', limit: 500 },
  { id: 'Q1266591', category: 'Sports', label: 'association football match', limit: 500 },

  // ===========================================
  // GOVERNMENT & POLITICS
  // ===========================================
  { id: 'Q7188', category: 'Government', label: 'government', limit: 2500 },
  { id: 'Q327333', category: 'Government', label: 'government agency', limit: 3000 },
  { id: 'Q7278', category: 'Government', label: 'political party', limit: 1000 },
  { id: 'Q1752346', category: 'Government', label: 'election', limit: 1500 },
  { id: 'Q16334295', category: 'Government', label: 'group of humans', limit: 2000 },
  { id: 'Q4407246', category: 'Government', label: 'political term', limit: 1000 },
  { id: 'Q1063239', category: 'Government', label: 'diplomatic mission', limit: 500 },
  { id: 'Q1549591', category: 'Government', label: 'public office', limit: 1500 },
  { id: 'Q294163', category: 'Government', label: 'public policy', limit: 500 },
  { id: 'Q1002697', category: 'Government', label: 'political ideology', limit: 500 },
  { id: 'Q188913', category: 'Government', label: 'voting', limit: 500 },
  { id: 'Q22685', category: 'Government', label: 'prime minister', limit: 500 },
  { id: 'Q30461', category: 'Government', label: 'president', limit: 500 },
  { id: 'Q52062', category: 'Government', label: 'national assembly', limit: 500 },

  // ===========================================
  // PHILOSOPHY
  // ===========================================
  { id: 'Q5891', category: 'Philosophy', label: 'philosophy', limit: 3000 },
  { id: 'Q1387659', category: 'Philosophy', label: 'philosophical concept', limit: 1500 },
  { id: 'Q483247', category: 'Philosophy', label: 'phenomenon', limit: 1000 },
  { id: 'Q331769', category: 'Philosophy', label: 'philosophical movement', limit: 500 },
  { id: 'Q7184903', category: 'Philosophy', label: 'philosophical school', limit: 500 },
  { id: 'Q641118', category: 'Philosophy', label: 'logical concept', limit: 500 },

  // ===========================================
  // CULTURE
  // ===========================================
  { id: 'Q132241', category: 'Culture', label: 'festival', limit: 1500 },
  { id: 'Q9134', category: 'Culture', label: 'mythology', limit: 1000 },
  { id: 'Q36649', category: 'Culture', label: 'tradition', limit: 1000 },
  { id: 'Q132821', category: 'Culture', label: 'ritual', limit: 1000 },
  { id: 'Q25295', category: 'Culture', label: 'cultural heritage', limit: 1000 },
  { id: 'Q12758529', category: 'Culture', label: 'national symbol', limit: 500 },
  { id: 'Q4895393', category: 'Culture', label: 'national heritage', limit: 500 },
  { id: 'Q149918', category: 'Culture', label: 'costume', limit: 500 },
  { id: 'Q1071', category: 'Culture', label: 'cuisine', limit: 1000 },
  { id: 'Q106559804', category: 'Culture', label: 'cultural concept', limit: 1000 },
  { id: 'Q11028', category: 'Culture', label: 'information', limit: 500 },
  { id: 'Q13028', category: 'Culture', label: 'holiday', limit: 500 },
  { id: 'Q210272', category: 'Culture', label: 'cultural heritage', limit: 1000 },

  // ===========================================
  // EDUCATION
  // ===========================================
  { id: 'Q3918', category: 'Education', label: 'university', limit: 1000 },
  { id: 'Q38723', category: 'Education', label: 'higher education institution', limit: 1500 },
  { id: 'Q3914', category: 'Education', label: 'school', limit: 3000 },
  { id: 'Q170584', category: 'Education', label: 'project', limit: 1500 },
  { id: 'Q4830453', category: 'Education', label: 'business', limit: 1500 },
  { id: 'Q11303', category: 'Education', label: 'educational program', limit: 500 },
  { id: 'Q3918409', category: 'Education', label: 'academic institution', limit: 1000 },
  { id: 'Q189533', category: 'Education', label: 'academic degree', limit: 500 },
  { id: 'Q194356', category: 'Education', label: 'library', limit: 1000 },
  { id: 'Q33506', category: 'Education', label: 'museum', limit: 1500 },

  // ===========================================
  // LANGUAGE & LINGUISTICS
  // ===========================================
  { id: 'Q34770', category: 'Language', label: 'language', limit: 5000 },
  { id: 'Q33742', category: 'Language', label: 'natural language', limit: 1000 },
  { id: 'Q315', category: 'Language', label: 'language family', limit: 1000 },
  { id: 'Q45762', category: 'Language', label: 'sign language', limit: 300 },
  { id: 'Q838552', category: 'Language', label: 'programming language', limit: 500 },
  { id: 'Q12909644', category: 'Language', label: 'linguistic concept', limit: 1000 },
  { id: 'Q1995212', category: 'Language', label: 'word', limit: 1000 },
  { id: 'Q9135', category: 'Language', label: 'operating system', limit: 500 },
  { id: 'Q8142', category: 'Language', label: 'currency', limit: 500 },

  // ===========================================
  // LAW & LEGAL
  // ===========================================
  { id: 'Q7748', category: 'Law', label: 'law', limit: 3000 },
  { id: 'Q820655', category: 'Law', label: 'statute', limit: 1500 },
  { id: 'Q40348', category: 'Law', label: 'legal case', limit: 1000 },
  { id: 'Q11204', category: 'Law', label: 'court', limit: 1000 },
  { id: 'Q3529618', category: 'Law', label: 'legal process', limit: 500 },
  { id: 'Q5153359', category: 'Law', label: 'constitution', limit: 500 },
  { id: 'Q93288', category: 'Law', label: 'contract', limit: 500 },
  { id: 'Q8434', category: 'Law', label: 'education', limit: 1000 },
  { id: 'Q49850', category: 'Law', label: 'legal document', limit: 1000 },
  { id: 'Q879146', category: 'Law', label: 'legal term', limit: 1000 },
  { id: 'Q207965', category: 'Law', label: 'criminal activity', limit: 500 },
  { id: 'Q1079023', category: 'Law', label: 'crime', limit: 1000 },

  // ===========================================
  // SOCIETY & ORGANIZATIONS
  // ===========================================
  { id: 'Q43229', category: 'Society', label: 'organization', limit: 5000 },
  { id: 'Q49773', category: 'Society', label: 'social movement', limit: 2000 },
  { id: 'Q4830453', category: 'Society', label: 'business', limit: 2000 },
  { id: 'Q783794', category: 'Society', label: 'company', limit: 2000 },
  { id: 'Q6881511', category: 'Society', label: 'enterprise', limit: 1000 },
  { id: 'Q163740', category: 'Society', label: 'nonprofit organization', limit: 1000 },
  { id: 'Q15911314', category: 'Society', label: 'association', limit: 1000 },
  { id: 'Q158852', category: 'Society', label: 'social class', limit: 500 },
  { id: 'Q18325087', category: 'Society', label: 'social group', limit: 1000 },
  { id: 'Q7210356', category: 'Society', label: 'product', limit: 1500 },

  // ===========================================
  // HUMANITIES & ART MOVEMENTS
  // ===========================================
  { id: 'Q7058673', category: 'Humanities', label: 'art genre', limit: 500 },
  { id: 'Q483394', category: 'Humanities', label: 'genre', limit: 1500 },
  { id: 'Q184296', category: 'Humanities', label: 'art movement', limit: 500 },
  { id: 'Q17362920', category: 'Humanities', label: 'literary genre', limit: 500 },
  { id: 'Q1792379', category: 'Humanities', label: 'art genre', limit: 500 },
  { id: 'Q735', category: 'Humanities', label: 'art', limit: 1000 },
  { id: 'Q309', category: 'Humanities', label: 'history', limit: 1000 },

  // ===========================================
  // ARCHITECTURE & BUILDINGS
  // ===========================================
  { id: 'Q41176', category: 'Architecture', label: 'building', limit: 3000 },
  { id: 'Q811979', category: 'Architecture', label: 'architectural structure', limit: 2000 },
  { id: 'Q570116', category: 'Architecture', label: 'tourist attraction', limit: 1500 },
  { id: 'Q12280', category: 'Architecture', label: 'bridge', limit: 1000 },
  { id: 'Q6999', category: 'Architecture', label: 'monument', limit: 1000 },
  { id: 'Q811979', category: 'Architecture', label: 'architectural style', limit: 500 },
  { id: 'Q23413', category: 'Architecture', label: 'castle', limit: 1000 },
  { id: 'Q16560', category: 'Architecture', label: 'palace', limit: 500 },
  { id: 'Q174782', category: 'Architecture', label: 'square', limit: 500 },
  { id: 'Q39614', category: 'Architecture', label: 'cemetery', limit: 500 },
  { id: 'Q35112127', category: 'Architecture', label: 'heritage building', limit: 1000 },
  { id: 'Q1081138', category: 'Architecture', label: 'tower', limit: 500 },

  // ===========================================
  // TRANSPORTATION
  // ===========================================
  { id: 'Q3407658', category: 'Transportation', label: 'transport system', limit: 1000 },
  { id: 'Q11446', category: 'Transportation', label: 'ship', limit: 1500 },
  { id: 'Q4167836', category: 'Transportation', label: 'Wikimedia category', limit: 500 },
  { id: 'Q728937', category: 'Transportation', label: 'railroad station', limit: 1000 },
  { id: 'Q928830', category: 'Transportation', label: 'metro station', limit: 500 },
  { id: 'Q94993988', category: 'Transportation', label: 'transit line', limit: 500 },
  { id: 'Q1248784', category: 'Transportation', label: 'airport', limit: 500 },
  { id: 'Q44782', category: 'Transportation', label: 'port', limit: 500 },
  { id: 'Q11442', category: 'Transportation', label: 'boat', limit: 1000 },
  { id: 'Q34486', category: 'Transportation', label: 'road', limit: 1000 },
  { id: 'Q1319599', category: 'Transportation', label: 'route', limit: 500 },

  // ===========================================
  // MILITARY
  // ===========================================
  { id: 'Q15623722', category: 'Military', label: 'military vehicle', limit: 1000 },
  { id: 'Q12876', category: 'Military', label: 'warship', limit: 1000 },
  { id: 'Q3715016', category: 'Military', label: 'military unit', limit: 1500 },
  { id: 'Q15142894', category: 'Military', label: 'military rank', limit: 500 },
  { id: 'Q728', category: 'Military', label: 'weapon', limit: 1500 },
  { id: 'Q1781', category: 'Military', label: 'war', limit: 1500 },
  { id: 'Q17295624', category: 'Military', label: 'military installation', limit: 1000 },
  { id: 'Q2486475', category: 'Military', label: 'military decoration', limit: 500 },
  { id: 'Q245065', category: 'Military', label: 'intergovernmental organization', limit: 500 },

  // ===========================================
  // ECONOMICS & FINANCE
  // ===========================================
  { id: 'Q4164871', category: 'Economics', label: 'economic concept', limit: 1000 },
  { id: 'Q192581', category: 'Economics', label: 'economic sector', limit: 500 },
  { id: 'Q192907', category: 'Economics', label: 'index', limit: 500 },
  { id: 'Q40080', category: 'Economics', label: 'bank', limit: 500 },
  { id: 'Q130879', category: 'Economics', label: 'stock exchange', limit: 300 },
  { id: 'Q4830453', category: 'Economics', label: 'business', limit: 1000 },
];

// Query SPARQL endpoint with retry
async function querySparql(query, retries = 3) {
  const params = new URLSearchParams({ query, format: 'json' });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${WIKIDATA_SPARQL}?${params}`, {
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'ViaBasilica/1.0 (https://github.com/viabasilica; contact@viabasilica.com)'
        }
      });

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          // Rate limited or service unavailable - wait and retry
          const waitTime = attempt * 5000;
          console.log(`  Rate limited, waiting ${waitTime / 1000}s...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        throw new Error(`SPARQL failed: ${res.status} ${res.statusText}`);
      }

      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`  Attempt ${attempt} failed: ${err.message}, retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Get all subclasses of a target class
async function getAllSubclasses(targetClassId, label, limit = 5000) {
  console.log(`Fetching subclasses of ${label} (${targetClassId})...`);

  // Use wdt:P279* for transitive subclass lookup
  const query = `
    SELECT DISTINCT ?class WHERE {
      ?class wdt:P279* wd:${targetClassId} .
    }
    LIMIT ${limit}
  `;

  const startTime = Date.now();

  try {
    const result = await querySparql(query);
    const elapsed = Date.now() - startTime;

    const classes = (result.results?.bindings || [])
      .map(b => b.class?.value?.split('/').pop())
      .filter(Boolean);

    console.log(`  Found ${classes.length} subclasses in ${elapsed}ms`);
    return classes;
  } catch (err) {
    console.error(`  Error fetching ${label}: ${err.message}`);
    return [];
  }
}

// Build the complete mapping
async function buildClassMapping() {
  const mapping = {};
  const stats = {
    totalClasses: 0,
    byCategory: {}
  };

  console.log('\n=== Building Wikidata Class Mapping ===\n');
  console.log(`Processing ${TARGET_CLASSES.length} target classes...\n`);

  for (const target of TARGET_CLASSES) {
    const subclasses = await getAllSubclasses(target.id, target.label, target.limit || 5000);

    let newClasses = 0;
    for (const classId of subclasses) {
      // First match wins (in case of overlap between categories)
      if (!mapping[classId]) {
        mapping[classId] = target.category;
        newClasses++;
      }
    }

    stats.byCategory[target.category] = (stats.byCategory[target.category] || 0) + newClasses;

    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 500));
  }

  stats.totalClasses = Object.keys(mapping).length;
  return { mapping, stats };
}

// Main execution
async function main() {
  const startTime = Date.now();

  try {
    const { mapping, stats } = await buildClassMapping();

    // Ensure output directory exists
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

    // Write the mapping file
    writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const fileSize = (JSON.stringify(mapping).length / 1024).toFixed(1);

    console.log('\n=== Build Complete ===\n');
    console.log(`Total classes mapped: ${stats.totalClasses}`);
    console.log(`File size: ${fileSize} KB`);
    console.log(`Time: ${elapsed}s`);
    console.log(`Output: ${OUTPUT_PATH}`);

    console.log('\nCategory distribution:');
    const sorted = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    for (const [category, count] of sorted) {
      console.log(`  ${category}: ${count} classes`);
    }

    console.log('\n To rebuild: node scripts/build-class-mapping.mjs');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main();
