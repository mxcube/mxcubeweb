import React from 'react';
import { MenuItem, SplitButton } from 'react-bootstrap';


export default class BeamlineActions extends React.Component {
  render() {
    return (
    <div>
    <div className="row" style={{ paddingTop: '0em', padding: '0.5em' }}>
    <SplitButton title={'Beamline Actions'}>
       <MenuItem eventKey="1">Action</MenuItem>
       <MenuItem eventKey="2">Another action</MenuItem>
       <MenuItem eventKey="3">Another</MenuItem>
       <MenuItem divider />
       <MenuItem eventKey="4">Separated link</MenuItem>
    </SplitButton>
    </div>
    </div>
     );
  }
}
