rm -rf docs/
rm -rf output/

# alias tetool=../tetool/index.js
alias tetool=./node_modules/.bin/tetool

tetool --site . --output output --title 'INCAForm Universal'

tetool --site . --output output --prebuilt beer:example-configurations/beer/
tetool --site . --output output --prebuilt fa:../fa-incaform/src/patternless/configurations/fa/
tetool --site . --output output --prebuilt go:example-configurations/go/
tetool --site . --output output --prebuilt hpo:example-configurations/hpo/

tetool --site . --output output --source ../plant-experimental-conditions-ontology/
tetool --site . --output output --source ../plant-trait-ontology/
tetool --site . --output output --source ../environmental-exposure-ontology/
tetool --site . --output output --source ../ontology-of-plant-stress/
