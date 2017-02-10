import _ from 'lodash';
import Papa from 'papaparse';

class SessionService {
  constructor() {
    this.name = 'DefaultSessionName';
  }

  exportXSV(xsvType) {
    var delimiter = (xsvType === 'tsv') ? '\t' : ',';
    var config = {
      quotes: false,
      quoteChar: '"',
      delimiter: delimiter,
      header: true,
      newline: "\n"
    };

    var gridData = _.map(this.rowData, function(row) {
      var result = _.omit(row, '$$hashKey');
      return result;
    });
    var text = Papa.unparse(gridData, config);

    var data = new Blob([text], {type: 'text/plain'});
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.exportedXSV !== null) {
      window.URL.revokeObjectURL(this.exportedXSV);
    }

    this.exportedXSV = window.URL.createObjectURL(data);

    var link = document.createElement('a');
    link.href = this.exportedXSV;
    link.download = 'filename.html';
    link.target = '_blank';
    document.body.appendChild(link);  // required in FF, optional for Chrome/Safari
    link.click();
    document.body.removeChild(link);  // required in FF, optional for Chrome/Safari
  }

  sayHello() {
    console.log('Hello from SessionService');
  }
}

export default SessionService;
