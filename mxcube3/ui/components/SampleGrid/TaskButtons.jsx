import React from 'react';
import { Button, Glyphicon, ButtonToolbar } from 'react-bootstrap';

export default class SampleTaskButtons extends React.Component {
  constructor(props) {
    super(props);
    this.showCharacterisationForm = this.handleSubmit.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.handleSubmit.bind(this, 'DataCollection');
  }


  handleSubmit(formName) {

    let sampleIds = [];

    for (let sampleId in this.props.selected) {

      if (this.props.selected[sampleId]) {
        sampleIds.push(sampleId);
      }
    }
    this.props.showForm(formName, sampleIds, this.props.defaultParameters);
  }

  render() {
    return (<ButtonToolbar>
                    <Button className="btn-primary" onClick={this.showCharacterisationForm}>
                         <Glyphicon glyph="plus" /> Characterisation
                    </Button>
                    <Button className="btn-primary" onClick={this.showDataCollectionForm}>
                         <Glyphicon glyph="plus" /> Data collection
                    </Button>
               </ButtonToolbar>);
  }
}

