import React from 'react'
import ReactDOM from 'react-dom'
import SampleGrid from 'SampleGrid'
import { samples_list } from 'test-samples-list'

var sample_grid = ReactDOM.render(<SampleGrid />, 
                  document.getElementById("container"))

sample_grid.add_samples(samples_list)

for (var sample_id in sample_grid.refs) {
    var sample_item = sample_grid.refs[sample_id];
    sample_item.setLoadable();
}



