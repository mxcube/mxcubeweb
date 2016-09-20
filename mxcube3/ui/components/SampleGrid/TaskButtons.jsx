import React from 'react';
import { Glyphicon, DropdownButton, MenuItem, OverlayTrigger, Tooltip } from 'react-bootstrap';

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

    const selected = []
    
    for (let sampleID in this.props.selected) {
      if (this.props.selected[sampleID]){
          selected.push(sampleID);
      }
    }

    this.props.showForm(formName, selected, parameters);
  }


  render() {
    return (
      <OverlayTrigger
          placement="top"
          overlay={(<Tooltip>Add Tasks</Tooltip>)}
      >
        <DropdownButton
          bsStyle="default"
          title={<span><Glyphicon glyph="plus" /></span>}
          id="pipeline-mode-dropdown"
        >
          <MenuItem eventKey="1" onClick={this.props.addSelectedSamples}>
            Sample
          </MenuItem>        
          <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
            Data collection
          </MenuItem>
          <MenuItem eventKey="3" onClick={this.showCharacterisationForm}>
            Characterisation
          </MenuItem>
        </DropdownButton>
      </OverlayTrigger>
    );
  }
}

