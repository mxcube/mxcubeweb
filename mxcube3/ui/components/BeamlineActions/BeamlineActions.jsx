import React from 'react';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';
import { MenuItem, SplitButton } from 'react-bootstrap';


export default class BeamlineActions extends React.Component {
  constructor(props) {
    super(props);
    this.executeAction = this.executeAction.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.data !== this.props.data;
  }

  executeAction(event, eventKey) {
    console.log(event);
    console.log(eventKey);
    alert('Alert from menu item.\neventKey: ${eventKey}');
  }

  render() {
    return (
    <div>
    <div className="row" style={{ paddingTop: '0em', padding: '0.5em' }}>
    <SplitButton title={'Beamline Actions'}>
       <MenuItem eventKey="1" onClick={this.executeAction}>Action</MenuItem>
       <MenuItem eventKey="2" onClick={this.executeAction}>Another action</MenuItem>
       <MenuItem eventKey="3"> Anotehr</MenuItem>
       <MenuItem divider />
       <MenuItem eventKey="4">Separated link</MenuItem>
    </SplitButton>
    </div>
    </div>
     );
  }
}
