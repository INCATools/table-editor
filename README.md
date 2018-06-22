# INCA table-editor: Ontology development for mere mortals

## Purpose

The INCA table editor enables biomedical curators to create new ontology term requests compositionally from a configurable set of existing ontologies and terminologies and within a familiar spreadsheet-like interface. Because directly editing ontology owl files requires considerable training (not to mention patience and QC), spreadsheet-based methods for term requests are not new; however, what INCA Table Editor provides a combination of three key innovations: configurable autocomplete, design-pattern driven logic, and (planned) GitHub integration. This democratizes and accelerates the term request process while also avoiding errors of logic right at the source. Each new term request is complete and logically valid, and is issued a generic IRI until such a time as it can be given an actual namespace and ID in an appropriate ontology.

The formal pattern-based approach we use is the [Dead Simple Ontology Design Patterns (DOSDP)](https://github.com/dosumis/dead_simple_owl_design_patterns) published here [(PMC5460348)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5460348/). The patterns are written in YAML. An example is [here](https://github.com/INCATools/table-editor/blob/master/docs/DOSDP_YAML_Example.png).

Using a different INCA configuration, the DOSDP can also be leveraged for instance-level annotations, such as between diseases and phenotypes, or genes and phenotypes, or a patient and phenotypes. This kind of annotation use case is sometimes called "A-box"; where as the terminology use case above is sometimes called "T-box".

## Live demo site

A live demo of the site can be seen at https://incatools.github.io/table-editor/; try out the beer example yourself (for other design patterns you will need to deploy it per instructions below). We welcome feedback at https://github.com/INCATools/table-editor/issues.

![Alt Text](https://media.giphy.com/media/LZkP2eXU51hYS5z4zn/giphy.gif)


## Deployment

This lightweight web application is intended to be deployed as a static single-page website, where the site can then be used to view and edit spreadsheet-formatted data while supporting autocomplete and selection from semantically associated ontologies and dictionaries. 

## Supported file types

Both TSV and CSV are supported, and are collectively referred to as "XSV" in the software and documentation.

The initial specification for this table-editor is drawn from https://github.com/INCATools/intelligent-concept-assistant/issues/2

## Current Limitations

- Autocomplete is hardcoded to use the Monarch Initiative autocomplete server, rather than being dynamically parameterized via a URL parameter.
- Selecting a cell should pop up the autocomplete menu immediately, rather than requiring a character be typed.
- Currently, the suffix ' label' on a column indicates that it is non-editable and derived from the root column name (e.g., 'location label' is derived from 'location'). This heuristic will be replaced by design guidance provided in the DOSDP YAML file.
- Some of the buttons and panels in the UI are to help debug this application, and not necessarily part of the final UI. For example, the display of the raw and parsed YAML is unnecessary.


## Usage

### Examples

The app has a few preloaded examples of YAML and CSV.

### Load File or Drag-and-Drop

A local XSV file can be viewed through the app by using the 'Load File' button or by dragging and dropping a file onto the dropzone

### Load URL

A remote XSV file can be loaded via URL.

*Note that if the remote file is hosted on a website that does not support CORS, then the request will be rejected. Such files can be copied locally and then viewed that way, however.*

### The `url` parameter

The `table-editor` app is designed so that the URL pointing to the app can be amended with an optional `url` parameter that points to a XSV file, subject to the same restrictions as Load URL above. For example, suppose this app is hosted on [https://github.com/INCATools/table-editor](https://github.com/INCATools/table-editor) and a desired Table file is hosted on [http://www.example.com/MyTableFile.gv](http://www.example.com/MyTableFile.gv). Then the following URL will launch the table-editor app and cause it to load and render the specified file:

> [https://github.com/INCATools/table-editor?url=http://www.example.com/MyTableFile.gv](https://github.com/INCATools/table-editor?url=http://www.example.com/MyTableFile.gv)

### Planned improvements

It is our intention to wire this directly into GitHub such that raw CSV/TSV can be checked out and edited, followed by a configurable action (whether a direct commit to master or a pull request).

## Requirements to build

This is what I use, you may get lucky with slightly older/newer versions. Don't even bother trying Node 0.1x.

- NodeJS 4.5.0
- NPM 3.10.8


## Requirements to run

Tested on MacOSX Safari, Chrome and FireFox. Requires some form of http-server. `npm run dev` will invoke the WebPack server for auto-bundling during development, and this is sufficient for demo purposes.


## Building

```
cd table-editor/ # If you aren't alread there
npm install
npm run build    # 'npm run fastbuild' to avoid minification
```

## Running

```
npm run dev
open http://localhost:8085/webpack-dev-server/table-editor # On MacOSX
# Alternatively, point your browser to:
#   http://localhost:8085/webpack-dev-server/table-editor
#
```

## Sources

- [Environmental Conditions](https://github.com/cmungall/environmental-conditions)
- [UPHENO](https://github.com/obophenotype/upheno)

## Dependencies, Licenses, Credits

- Angular
- Bootstrap
- https://github.com/nodeca/js-yaml
- https://github.com/danialfarid/ng-file-upload
- https://github.com/mholt/PapaParse
- https://github.com/angular-ui/ui-grid

