import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormGroup, Form, FormControl, ControlLabel, Button } from 'react-bootstrap';
import * as QueueActions from '../actions/queue';

class GroupFolderInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputOnChangeHandler = this.inputOnChangeHandler.bind(this);
    this.setGroupFolderInput = this.setGroupFolderInput.bind(this);
    this.inputValue = '';
    this.state = { validationState: 'success' };
  }

  setGroupFolderInput() {
    /* eslint-disable react/no-set-state */
    this.setState({ validationState: 'success' });
    /* eslint-enable react/no-set-state */
    this.props.queueActions.sendSetGroupFolder(this.inputValue.value);
  }

  inputOnSelectHandler(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  }

  inputOnChangeHandler() {
    /* eslint-disable react/no-set-state */
    this.setState({ validationState: 'warning' });
    /* eslint-enable react/no-set-state */
  }

  render() {
    return (
      <div>
        <ControlLabel>Group path:</ControlLabel>
        <Form inline onSubmit={e => { e.preventDefault(); }} >
          <FormGroup bsSize="small" validationState={this.state.validationState}>
            <FormControl
              bsSize="sm"
              defaultValue={this.props.queue.groupFolder}
              style={{ maxWidth: '13em', minWidth: '13em', marginRight: '0.5em' }}
              type="text"
              onSelect={this.inputOnSelectHandler}
              onChange={this.inputOnChangeHandler}
              inputRef={ (input) => {this.inputValue = input;} }
            />
          </FormGroup>
          <Button type="button" bsSize="small" onClick={this.setGroupFolderInput}>
            Set
          </Button>
        </Form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    queue: state.queue
  };
}

function mapDispatchToProps(dispatch) {
  return {
    queueActions: bindActionCreators(QueueActions, dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GroupFolderInput);

