import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Form, Button } from 'react-bootstrap';
import { setGroupFolder } from '../actions/queue';

class GroupFolderInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputOnChangeHandler = this.inputOnChangeHandler.bind(this);
    this.setGroupFolderInput = this.setGroupFolderInput.bind(this);
    this.inputValue = '';
    this.state = { validationState: 'success' };
  }

  setGroupFolderInput() {
    this.setState({ validationState: 'success' });
    this.props.setGroupFolder(this.inputValue.value);
  }

  inputOnSelectHandler(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  }

  inputOnChangeHandler() {
    this.setState({ validationState: 'warning' });
  }

  render() {
    return (
      <span>
        <Form.Label>Group path :</Form.Label>
        <br />
        <Form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Form.Group
            className="d-flex"
            validationState={this.state.validationState}
          >
            <Form.Control
              size="sm"
              defaultValue={this.props.queue.groupFolder}
              onSelect={this.inputOnSelectHandler}
              onChange={this.inputOnChangeHandler}
              ref={(ref) => {
                this.inputValue = ref;
              }}
            />
            <span style={{ marginRight: '0.5em' }} />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={this.setGroupFolderInput}
            >
              Set
            </Button>
          </Form.Group>
        </Form>
      </span>
    );
  }
}

function mapStateToProps(state) {
  return {
    queue: state.queue,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setGroupFolder: bindActionCreators(setGroupFolder, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupFolderInput);
