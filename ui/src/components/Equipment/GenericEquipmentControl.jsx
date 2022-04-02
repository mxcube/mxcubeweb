import React from 'react';
import { Panel, PanelGroup, Button } from 'react-bootstrap';
import Form from '@rjsf/core';
import './GenericEquipmentControl.css';

export default class GenericEquipmentControl extends React.Component {
    handleRunCommand(cmd, formData) {
    this.props.executeCommand(this.props.equipment.name, cmd, formData)
  }

  renderParameters(key) {
    const a = this.props.equipment.attributes;
    const attr = a[key];

    if (attr.signature.length > 1) {
      const schema = JSON.parse(attr.schema);

      return (
        <div>
          <h3>Arguments:</h3>
          <Form
            onSubmit={(formData, e) => this.handleRunCommand(key, formData.formData, e)}
            disabled={this.props.equipment.state !== 'READY'}
            schema={schema}
          >
            <Button type="submit"><b>Run {key}</b></Button>
          </Form>
        </div>
      );
    } else {
        return (
          <span>
            <p>(No arguments)</p>
            <Button type="submit" onClick={(e) => this.handleRunCommand(key, {}, e)}><b>Run {key}</b></Button>
           </span>
        );
    }
  }

  renderInfo(key) {
    const a = this.props.equipment.attributes;
    const attr = a[key];

    if (attr.signature.length > 1) {
      const schema = JSON.parse(attr.schema);
      delete schema.definitions;
      delete schema.type;
      delete schema.title

      return (
        <div>
          <h3>Signature</h3>
          <pre>
            {JSON.stringify(schema,null,'\t')}
          </pre>
        </div>
      );
    } else {
        return (<p/>);
    }
  }

  getCommands() {
    const a = this.props.equipment.attributes;

    return Object.entries(a).map(([key, value]) => {
      return (
       <Panel bsStyle="info" className="command-panel">
         <Panel.Heading> <Panel.Title toggle><b>Command: {key}</b></Panel.Title></Panel.Heading>
         <Panel.Collapse>
           <Panel.Body>
             <div className="col-xs-6">
               {this.renderParameters(key)}
             </div>
             <div className="col-xs-6">
               {this.renderInfo(key)}
             </div>
           </Panel.Body>
         </Panel.Collapse>
       </Panel>
      );
    })
  }

  titleBackgroundClass(){
    let titleBackground = 'danger';

    if (this.props.equipment.state=== 'READY') {
        titleBackground = 'success';
      } else if (this.props.equipment.state=== 'MOVING') {
        titleBackground = 'warning';
      } else if (this.props.equipment.state=== 'DISABLED') {
        titleBackground = 'default';
      }

      return titleBackground;
  }

  render() {
    return (
      <div className={'row generic-equipment-container'}>
        <div className="col-xs-12">
            <Panel defaultExpanded bsStyle={this.titleBackgroundClass()}>
              <Panel.Heading>
                <Panel.Title toggle>{this.props.equipment.name} ({this.props.equipment.state})</Panel.Title>
              </Panel.Heading>
            <Panel.Collapse>
              <Panel.Body className="generic-equipment-container-panel-body" collapsible>
                {this.getCommands()}
                {this.renderDialog}
              </Panel.Body>
            </Panel.Collapse>
            </Panel>
        </div>
      </div>
    );
  }
}
