import React, {Component} from 'react';
import {reduxForm} from 'redux-form';
import { Input, Button, Glyphicon, ButtonToolbar, SplitButton, MenuItem  } from "react-bootstrap"


class SampleQueueSearch extends Component {
  render() {
    const {fields: {sampleName}} = this.props;

    const innerSearchIcon = (
      <Button><Glyphicon glyph="search"/></Button>
    );

    return (
         <form>
                <Input type="text" placeholder="Search Sample" buttonAfter={innerSearchIcon} {...sampleName} />
         </form>
    );
  }
}

SampleQueueSearch = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'search-sample',                           // a unique name for this form
  fields: ['sampleName'] // all the fields in your form
})(SampleQueueSearch);

export default SampleQueueSearch;