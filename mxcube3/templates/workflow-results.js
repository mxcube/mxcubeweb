const dust = require('dustjs-linkedin');
const fetch = require('isomorphic-fetch');
require('./precompiled.templates.min.js');
require('dustjs-helpers');

function assemble_result(data) {
  var html = "";

  for (var i = 0; i < data.items.length; i = i + 1) {
    dust.render("workflowmainview.template", data.items[i], function (error, output) {
      html = html + output;
    });
  }

  console.log(html);
}

function get_result(url) {
  fetch(url, {
    method: 'GET',
    credentials: 'include'
  }).then(response => {
    if (response.status >= 400) {
    }
    return response.json();
  }).then(response => {
    assemble_result(response);
  });
};

if (process.argv.length > 2) {
  get_result(process.argv[2]);
}
