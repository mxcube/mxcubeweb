import React from 'react'
import { Button, Glyphicon, ButtonToolbar } from "react-bootstrap"

export default class SampleTaskButtons extends React.Component {
     constructor(props) {
         super(props);

         this.showCharacterisationForm = this.props.showForm.bind(this, "Characterisation");
         this.showDataCollectionForm = this.props.showForm.bind(this, "DataCollection");
     }


     handleSubmit(){
     /*
            this.props.checked.map( (queue_id) =>{
                if(this.props.lookup[queue_id]){
                    this.props.addTask(queue_id, this.props.lookup[queue_id],{Type: "Centring"});
                }
            });
    */
    }

    render() { 
        return (<ButtonToolbar>
                    <Button className="btn-primary" onClick={this.showCharacterisationForm}>
                         <Glyphicon glyph="plus" /> Characterisation
                    </Button>
                    <Button className="btn-primary" onClick={this.showDataCollectionForm}>
                         <Glyphicon glyph="plus" /> Data collection
                    </Button>
               </ButtonToolbar>)
    }
}

