import React from 'react'
import { Button, Glyphicon, ButtonToolbar } from "react-bootstrap"

export default class SampleTaskButtons extends React.Component {
     constructor(props) {
         super(props);
         this.showCharac = this.handleSubmit.bind(this, "Characterisation");
         this.showDataCollec = this.handleSubmit.bind(this, "DataCollection");
     }


     handleSubmit(formName){

        let sampleIds = [];

        for(let sampleId in this.props.selected){

            if(this.props.selected[sampleId]){
                sampleIds.push(sampleId);
            }
        }      
        this.props.showForm(formName, sampleIds, this.props.defaultParameters);
    }

    render() {
        return (<ButtonToolbar>
                    <Button className="btn-primary" onClick={this.showCharac}>
                         <Glyphicon glyph="plus" /> Characterisation
                    </Button>
                    <Button className="btn-primary" onClick={this.showDataCollec}>
                         <Glyphicon glyph="plus" /> Data collection
                    </Button>
               </ButtonToolbar>)
    }
}

