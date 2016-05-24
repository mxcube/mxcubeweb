import React from 'react';


import Switch from 'react-bootstrap-switch';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';


export default class InOutSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }


  componentWillReceiveProps(nextProps) {
  }


  onChange(state){
    if (this.props.onSave !== undefined) {
      const value = state ? 'in' : 'out';
      this.props.onSave(this.props.pkey, value);
    }
  }


  shouldComponentUpdate(nextProps) {
    return nextProps.data !== this.props.data;
  }


  render() {
    const switchState = this.props.data.state === 'in' ? true : false;

    return (
      <div>
        <Switch
          size="mini"
          onText={this.props.onText}
          offText={this.props.offText}
          state={switchState}
          labelText={this.props.labelText}
	  onChange={this.onChange}
        />
      </div>
    )
  }
}


InOutSwitch.defaultProps = {
  onText: 'Opened',
  offText: 'Closed',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: { value: 'undefined', state: 'IN', msg: '' }
};
