'use strict';
import React from 'react'
import "bootstrap"
import "./app.less"
import cx from 'classnames'
import MethodItem from './MethodItem'



export default class CurrentTree extends React.Component {

 constructor(props) {
        super(props);
        this.moveCard = this.moveCard.bind(this);
        this.deleteMethod = this.deleteMethod.bind(this);
        this.collapse = this.props.collapse.bind(this,"current");
        this.runSample = this.runSample.bind(this);
    }

    moveCard(dragIndex, hoverIndex) {
        this.props.changeOrder(this.props.mounted, dragIndex, hoverIndex);
    }

    deleteMethod(methodId){
        this.props.deleteMethod(this.props.mounted, methodId , this.props.lookup[this.props.mounted] )
    }

    runSample(){
        this.props.run(this.props.mounted);
    }

    render() {
        let node = this.props.mounted;
        let sampleData, sampleMethods = [];

        if(node){
          sampleData = this.props.sampleInformation[this.props.lookup[node]];
          sampleMethods = this.props.queue[node];
        }

        var bodyClass = cx('list-body',{
            'hidden': (this.props.show || !node)
        }); 
        return (
            <div className="m-tree">
                <div className="list-head">
                    <span className="queue-root" onClick={this.collapse}>{(node ? 'Vial ' + sampleData.id : "No Sample Mounted")}</span>
                     <div className={node && sampleMethods.length ? "pull-right" : "hidden"}>
                        <i className="fa fa-play" onClick={this.runSample}></i>
                        <i className="fa fa-pause"></i>
                        <i className="fa fa-stop"></i>
                    </div>
                    <hr className="queue-divider" />
                </div>
                <div className={bodyClass}>
                   {sampleMethods.map((id, i) => {
                    let methodData = sampleData.methods[id];
                    return (
                        <MethodItem key={id}
                            index={i}
                            id={id}
                            data={methodData}
                            moveCard={this.moveCard}
                            deleteMethod={this.deleteMethod}
                            showForm={this.props.showForm} 
                            sampleId={this.props.mounted}
                            checked={this.props.checked}
                            toggleChecked={this.props.toggleCheckBox}
                        />
                    );
                })}
                </div>
            </div>
        );
    }
}