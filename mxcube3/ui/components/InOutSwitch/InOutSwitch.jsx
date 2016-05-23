import React from 'react';


import Switch from 'react-bootstrap-switch';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';


export default class InOutSwitch extends React.Component {
  constructor(props) {
    super(props);
  }


  componentWillReceiveProps(nextProps) {
  }


  shouldComponentUpdate(nextProps) {
    return nextProps.data !== this.props.data;
  }


  render() {
    return (
      <div>
        <Switch
          size="mini"
          onText={this.props.onText}
          offText={this.props.offText}
          state={this.props.data.value}
          labelText={this.props.labelText}
        />
      </div>
    )
  }
}


InOutSwitch.defaultProps = {
  onText: 'Opened',
  offText: 'Closed',
  labelText: '',
  data: { value: false, state: 'IN', msg: '' }
};
