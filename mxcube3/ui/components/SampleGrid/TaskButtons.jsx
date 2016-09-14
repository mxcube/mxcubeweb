import React from 'react';
import { Glyphicon, DropdownButton, MenuItem } from 'react-bootstrap';

export default class SampleTaskButtons extends React.Component {
  constructor(props) {
    super(props);
    this.showCharacterisationForm = this.handleSubmit.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.handleSubmit.bind(this, 'DataCollection');
  }


  handleSubmit(formName) {
    const parameters = { parameters:
                         { ...this.props.defaultParameters[formName.toLowerCase()] }
                       };

    this.props.showForm(formName, Object.keys(this.props.selected), parameters);
  }


  render() {
    return (
      <DropdownButton
        bsStyle="default"
        title={<span><Glyphicon glyph="plus" /> Add tasks </span>}
        id="pipeline-mode-dropdown"
      >
      <MenuItem eventKey="1" onClick={this.showCharacterisationForm}>
          Characterisation
        </MenuItem>
        <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
          Data collection
        </MenuItem>
      </DropdownButton>
    );
  }
}

