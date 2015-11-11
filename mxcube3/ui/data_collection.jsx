import React from 'react';
import ReactDOM from 'react-dom';

let filter_input = ReactDOM.render(searchInput, document.getElementById("filter_input"));
let check_sc_contents = ReactDOM.render(checkScContents, document.getElementById("check_sc_contents"));
let sample_grid = ReactDOM.render(<SampleGrid/>, document.getElementById("sample_grid"));


