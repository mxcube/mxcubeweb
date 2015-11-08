import React from 'react';
import ReactDOM from 'react-dom';
import SampleGrid from 'SampleGrid';
import LoginForm from 'Login';
import ErrorPanel from 'Logging';
import { samples_list } from 'test-samples-list';
import { Navbar, NavBrand, Input, Button, Glyphicon  } from "react-bootstrap";

const innerSearchIcon = (
    <Button><Glyphicon glyph="search"/></Button>
);

const searchInput = (
    <form className="form-horizontal">
        <Input type="text" label="Filter" labelClassName="col-xs-1" wrapperClassName="col-xs-3" buttonAfter={innerSearchIcon}/>
    </form>
);

const navbar = (
    <Navbar inverse fluid>
        <NavBrand><a href="#">MXCuBE 3</a></NavBrand>
        <LoginForm/>
    </Navbar>
);

const checkScContents = (
    <Button className="btn-primary">Check sample changer contents</Button>
);


window.logger = ReactDOM.render(<ErrorPanel/>, document.getElementById("error_log_panel"));
ReactDOM.render(navbar, document.getElementById("header"));
let filter_input = ReactDOM.render(searchInput, document.getElementById("filter_input"));
let check_sc_contents = ReactDOM.render(checkScContents, document.getElementById("check_sc_contents"));
let sample_grid = ReactDOM.render(<SampleGrid/>, document.getElementById("sample_grid"));
let go_to_dc = ReactDOM.render(<span className='pull-right'><a href='data_collection'>Go to data collection<Glyphicon glyph='menu-right'/></a></span>, document.getElementById("go_to_dc"));

sample_grid.add_samples(samples_list)

for (var sample_id in sample_grid.refs) {
    var sample_item = sample_grid.refs[sample_id];
    sample_item.setLoadable();
}



