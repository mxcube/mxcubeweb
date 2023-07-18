import React, { Component } from 'react';
import { reduxForm } from 'redux-form';
import { Input, Button } from 'react-bootstrap';
import { MdSearch } from 'react-icons/md';

class SampleQueueSearch extends Component {
  render() {
    const {
      fields: { sampleName },
    } = this.props;

    const innerSearchIcon = (
      <Button>
        <MdSearch glyph="search" />
      </Button>
    );

    return (
      <div id="search-queue">
        <Input
          type="text"
          placeholder="Search Sample"
          buttonAfter={innerSearchIcon}
          {...sampleName}
        />
      </div>
    );
  }
}

SampleQueueSearch = reduxForm({
  // <----- THIS IS THE IMPORTANT PART!
  form: 'search-sample', // a unique name for this form
  fields: ['sampleName'], // all the fields in your form
})(SampleQueueSearch);

export default SampleQueueSearch;
