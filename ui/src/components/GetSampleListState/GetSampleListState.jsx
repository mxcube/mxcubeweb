import React from 'react';
import { Badge } from 'react-bootstrap';

export default class GetSamepleListState extends React.Component {
  render() {
    let msgBgStyle = 'warning';
    // console.log("Object.keys(this.props.data).length ")
    // console.log(Object.keys(this.props.data).length)
    // console.log(this.props.data)


    if (Object.keys(this.props.data).length !=0 ) {
      msgBgStyle = 'info';
    }

    const msgLabelStyle = { display: 'block', fontSize: '100%',
      borderRadius: '0px', color: '#000' };


    let if_get_samplelist = 'False'

    if (Object.keys(this.props.data).length !=0 ){
      if_get_samplelist = 'True'
    }
    
    return (
      <div>
        <Badge
          bg="secondary"
          style={{ display: 'block', marginBottom: '3px' }}
        >
          {this.props.labelText}
        </Badge>
        <Badge bg={msgBgStyle} style={msgLabelStyle}>{if_get_samplelist}</Badge>
      </div>
    );
  }
}


GetSamepleListState.defaultProps = {
  labelText: '',
  pkey: undefined,
  data: {},
};
