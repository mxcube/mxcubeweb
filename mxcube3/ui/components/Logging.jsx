import ReactDOM from 'react-dom';
import React from 'react';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Alert } from "react-bootstrap";

export class ErrorNotificationPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
        window.error_notification = this;
    }

    notify(err) {
        this.setState({error: err});
    }

    clear() {
        this.setState({error: null});
    }

    render() {
        if (this.state.error) {
            return (<div style={{marginBottom: '-20px'}}><Alert bsStyle="danger" onDismiss={this.clear.bind(this)}>
		        <strong>Error:&nbsp;</strong>{this.state.error}
                   </Alert></div>);
            
        }
        return (<div></div>); 
    }    
}

export class Logging extends React.Component {
    constructor(props) {
        super(props);
        this.npages = 5;
        this.records_per_page = 1;
        this.state = { log_records: [], curr_page: 1, start_page: 1, last_page: this.npages, total_pages: 0 };
    }

    componentDidMount() {
        this.setState({"log_records": window.log_records});
        this._handle_log_record = (e) => { 
	    this.state.log_records.push(JSON.parse(e.data));
            this.setState({"log_records": this.state.log_records});
        }
        window.log_records_source.addEventListener('message', this._handle_log_record, false);
    }

    componentWillUnmount() {
        window.log_records_source.removeEventListener('message', this._handle_log_record);
    }

    previousClicked() {
        let sp = this.state.curr_page-this.npages;
        if (sp < 1) { sp = 1; }
        
        this.setState({ last_page: this.state.curr_page, start_page: sp });
    
    }

    nextClicked() {
        let lp = this.state.curr_page+this.npages;
        if (lp > this.state.total_pages) { lp = this.state.total_pages }
        this.setState({ start_page: this.state.curr_page, last_page: lp });
    }

    pageClicked(i,e) {
        e.preventDefault();
       	this.setState({curr_page: i });
    }

    render() {
        var pages = [];
        var log_output = [];
        var log_record;
        var i;
        
        let total_pages = Math.floor(this.state.log_records.length / this.records_per_page);
        if (this.state.log_records.length % this.records_per_page) { total_pages++ };
        this.state.total_pages = total_pages;
                                      
        for (i = this.state.start_page; i <= Math.min(total_pages, this.state.last_page); i++) {
            let active = i==this.state.curr_page ? "active" : "";
            pages.push(<li className={active} key={i}><a href="#" onClick={this.pageClicked.bind(this, i)}>{i}</a></li>);
        }
 
        i = 0;
        for (log_record of this.state.log_records) {
            log_output.push(<pre key={i} style={{margin: "0px", border: "0px"}}>{log_record.message}</pre>)
            ++i;
        }
        
        return (<div className='col-xs-12'>
                    <nav>
                        <ul className="pagination">
                            {(() => {
                                if (total_pages > this.npages) { return <li>
                                    <a href="#" onClick={(e)=> { e.preventDefault(); return this.previousClicked() }}><span aria-hidden="true">&laquo;</span></a>
                                </li> } else { return "" };
                            })()}
                            {pages}
                            {(() => {
                                if ((this.state.curr_page+this.npages) < total_pages) { return <li>
                                    <a href="#" onClick={(e)=> { e.preventDefault(); return this.nextClicked() }}><span aria-hidden="true">&raquo;</span></a>
                                </li> } else { return "" };
                            })()}
                        </ul>
                    </nav>
                    {log_output}
               </div>)
    }
}
