'use strict';
import React from 'react'
import "bootstrap"
import "./app.less"
import cx from 'classnames'
import TaskItem from './TaskItem'



export default class CurrentTree extends React.Component {

 constructor(props) {
        super(props);
        this.moveCard = this.moveCard.bind(this);
        this.deleteTask = this.deleteTask.bind(this);
        this.collapse = this.props.collapse.bind(this,"current");
        this.runSample = this.runSample.bind(this);
    }

    moveCard(dragIndex, hoverIndex) {
        this.props.changeOrder(this.props.mounted, dragIndex, hoverIndex);
    }

    deleteTask(taskId){
        this.props.deleteTask(this.props.mounted, taskId , this.props.lookup[this.props.mounted] )
    }

    runSample(){
        this.props.run(this.props.mounted);
    }

    render() {
        let node = this.props.mounted;
        let sampleData, sampleTasks = [];

        if(node){
          sampleData = this.props.sampleInformation[this.props.lookup[node]];
          sampleTasks = this.props.queue[node];
        }

        var bodyClass = cx('list-body',{
            'hidden': (this.props.show || !node)
        }); 
        return (
            <div className="m-tree">
                <div className="list-head">
                    <span className="queue-root" onClick={this.collapse}>{(node ? 'Vial ' + sampleData.id : "No Sample Mounted")}</span>
                    <i className="fa fa-plus" onClick={() => this.props.showForm("AddSample")}></i>
                     <div className={node && sampleTasks.length ? "pull-right" : "hidden"}>
                        <i className="fa fa-play" onClick={this.runSample}></i>
                        <i className="fa fa-pause"></i>
                        <i className="fa fa-stop"></i>
                    </div>
                    <hr className="queue-divider" />
                </div>
                <div className={bodyClass}>
                   {sampleTasks.map((id, i) => {
                    let taskData = sampleData.tasks[id];
                    return (
                        <TaskItem key={id}
                            index={i}
                            id={id}
                            data={taskData}
                            moveCard={this.moveCard}
                            deleteTask={this.deleteTask}
                            showForm={this.props.showForm} 
                            sampleId={sampleData.id}
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