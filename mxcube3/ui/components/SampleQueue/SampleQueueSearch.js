import React, {Component} from 'react';
import {reduxForm} from 'redux-form';

class SampleQueueSearch extends Component {
  render() {
    const {fields: {sampleName}} = this.props;
    return (
        <div className="sample-search">
          <input type="text" placeholder="Search Sample" className="searchBox" {...sampleName}/>
        </div>
    );
  }
}

SampleQueueSearch = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'search-sample',                           // a unique name for this form
  fields: ['sampleName'] // all the fields in your form
})(SampleQueueSearch);

export default SampleQueueSearch;