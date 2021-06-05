/**
 * Helper script to generate random annotations for testing
 */
const uuid = require('uuid/v1');
const fs = require('fs');

const NUM_ANNOTATIONS = 3000;  // Number of annotations to generate
const TEXT_CHARSIZE = 185000;  // Text length in characters
const MAX_ANNOTATION_SIZE=400; // Maximum length of annotations in characters 

const annotations = [];

for (let i=0; i<NUM_ANNOTATIONS; i++) {
  const start = Math.floor(Math.random() * TEXT_CHARSIZE);
  const length = Math.ceil(Math.random() * MAX_ANNOTATION_SIZE) + 4;

  annotations.push({
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": `#${uuid()}`,
    "type": "Annotation",
    "body": [{
      "type": "TextualBody",
      "value": "A random annotation"
    }],
    "target": {
      "selector": [{
        "type": "TextQuoteSelector",
        "exact": "Troy"
      }, {
        "type": "TextPositionSelector",
        "start": start,
        "end": start + length
      }]
    }
  });
}

fs.writeFileSync('annotations.w3c.js', `export default ${JSON.stringify(annotations)}`);
