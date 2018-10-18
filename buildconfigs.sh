rm -rf docs/
rm -rf output/

# alias tetool=../tetool/index.js
alias tetool=../tetool/index.js # ./node_modules/.bin/tetool

../tetool/index.js --site . --output output --title 'INCAForm Universal'

../tetool/index.js --site . --output output --prebuilt beer:example-configurations/beer/

../tetool/index.js --site . --output output --source ../plant-trait-ontology/@fix-patterns
../tetool/index.js --site . --output output --source ../plant-experimental-conditions-ontology/@fix-patterns
../tetool/index.js --site . --output output --source ../ontology-of-plant-stress/

../tetool/index.js --site . --output output --source ../environmental-exposure-ontology/
../tetool/index.js --site . --output output --source ../bio-attribute-ontology/@rename-iri-to-defined-class

../tetool/index.js --site . --output output --prebuilt fa:../fa-incaform/src/patternless/configurations/fa/
../tetool/index.js --site . --output output --prebuilt go:example-configurations/go/
../tetool/index.js --site . --output output --prebuilt hpo:example-configurations/hpo/
