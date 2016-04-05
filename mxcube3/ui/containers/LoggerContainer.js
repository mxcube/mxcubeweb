import React from 'react';
import { connect } from 'react-redux';


export default class LoggerContainer extends React.Component {

    render() {
        let logOutput = [];
        this.props.records.map((record, index) =>{
          logOutput.push(<tr key={index}><td>{record.timestamp}</td><td>{record.logger}</td><td>{record.severity}</td><td>{record.message}</td></tr>)
        });

        return (<div className='col-xs-12'>
                    <row>
                    <div className="col-xs-12">
                    <table className="table table-condensed table-striped">
                        <thead>
                            <tr>
                                <th className="col-sm-2">Time</th>
                                <th className="col-sm-1">Logger</th>
                                <th className="col-sm-1">Severity</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logOutput}
                        </tbody>
                    </table>
                    </div>
                    </row>
               </div>
      )
    }    
}


function mapStateToProps(state) {
        return { 
          records : state.logger.logRecords
        }
}

export default connect(
    mapStateToProps,
)(LoggerContainer);
