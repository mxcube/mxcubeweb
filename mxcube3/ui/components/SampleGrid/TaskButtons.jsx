import React from 'react';
import { Button, Glyphicon, DropdownButton, MenuItem } from 'react-bootstrap';

export default class SampleTaskButtons extends React.Component {
  constructor(props) {
    super(props);
    this.showCharacterisationForm = this.handleSubmit.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.handleSubmit.bind(this, 'DataCollection');
  }


  handleSubmit(formName) {
    const sampleIds = [];

    for (const sampleId in this.props.selected) {
      if (this.props.selected[sampleId]) {
        sampleIds.push(sampleId);
      }
    }

    this.props.showForm(formName, sampleIds, this.props.defaultParameters);
  }

  render() {
    return (
      <DropdownButton
        bsStyle="primary"
        title="Pipeline Mode"
      >
        <MenuItem eventKey="1">
          <Button className="btn-primary" onClick={this.showCharacterisationForm}>
            <Glyphicon glyph="plus" /> Characterisation
          </Button>
        </MenuItem>
        <MenuItem eventKey="2">
          <Button className="btn-primary" onClick={this.showDataCollectionForm}>
            <Glyphicon glyph="plus" /> Data collection
          </Button>
        </MenuItem>
      </DropdownButton>
    );
  }
}

