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

    notify_noNavBar(err) {
        this.setState({error: err});
    }

    clear_noNavBar() {
        this.setState({error: null});
    }

    notify(err) {
        document.getElementsByTagName("nav")[0].classList.remove("navbar-fixed-top")
        this.setState({error: err});
    }

    clear() {
        this.setState({error: null});
        document.getElementsByTagName("nav")[0].classList.add("navbar-fixed-top")
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
        this.npages = 15;
        this.records_per_page = 20;
        this.state = { log_records: [], curr_page: 1, start_page: 1, last_page: 1, total_pages: 1 };
    }

    handle_record(record) {
	//this.state.log_records.push(record);
        this.setState({"log_records": window.log_records }); //this.state.log_records});
    }

    componentDidMount() {
        this.setState({"log_records": window.log_records});
        window.logging_component = this;
    }

    componentWillUnmount() {
        window.logging_component = null;
    }

    firstPageClicked(e) {
        e.preventDefault();
        this.setState({ curr_page: 1, start_page: 1, last_page: Math.min(this.state.total_pages,this.npages) })
    }
 
    previousClicked(e) {
        e.preventDefault();
        var sp = this.state.start_page; 
        var lp = this.state.last_page;
        var p = this.state.curr_page;
        p = Math.max(p-1, 1);
        if (p < sp) { sp=Math.max(p-this.npages+1, 1); lp=sp+this.npages-1 } 
        this.setState({ curr_page: p, start_page: sp, last_page: lp });
    }

    nextClicked(e) {
        e.preventDefault();
        var sp = this.state.start_page; 
        var lp = this.state.last_page;
        var p = this.state.curr_page;
        p = Math.min(p+1, this.state.total_pages);
        if (p > lp) {
          sp = p;
          lp = Math.min(p+this.npages-1, this.state.total_pages);
        }
        this.setState({ curr_page: p, start_page: sp, last_page: lp });
    }

    lastPageClicked(e) {
        e.preventDefault();
        this.setState({ curr_page: this.state.total_pages, 
                        start_page: Math.max(this.state.total_pages-this.npages+1,1), 
                        last_page: this.state.total_pages });
    }

    pageClicked(i,e) {
        e.preventDefault();
       	this.setState({curr_page: i });
    }

    toggleStackTrace(i,e) {
        e.preventDefault();
        let log_record = this.state.log_records[i];
        log_record.show_stack = !log_record.show_stack; 
        this.setState({log_records: this.state.log_records});
    }

    render() {
        var pages = [];
        var log_output = [];
        var log_record;
        var i;
        
        let total_pages = Math.floor(this.state.log_records.length / this.records_per_page);
        if (this.state.log_records.length % this.records_per_page) { total_pages++ };
        this.state.total_pages = Math.max(total_pages, 1);

        while (((this.state.last_page-this.state.start_page)<(this.npages-1))&&(this.state.last_page < this.state.total_pages)) {
            this.state.last_page++;
        }                                      
        for (i = this.state.start_page; i <= this.state.last_page; i++) {
            let active = i==this.state.curr_page ? "active" : "";
            pages.push(<li className={active} key={i}><a href="#" onClick={this.pageClicked.bind(this, i)}>{i}</a></li>);
        }
 
        i = (this.state.curr_page-1)*this.records_per_page;
        for (log_record of this.state.log_records.slice(i, i+this.records_per_page)) {
            let log_msg;
            if (log_record.stack_trace) {
                if (log_record.show_stack) {
                    log_msg = (<td><a href="#" onClick={this.toggleStackTrace.bind(this, i)}>{log_record.message}</a><br></br><pre className="bg-warning">{log_record.stack_trace}</pre></td>)
                } else {
                    log_msg = (<td><a href="#" onClick={this.toggleStackTrace.bind(this, i)}>{log_record.message}</a></td>)
                }
            } else {
                log_msg = (<td>{log_record.message}</td>)
            }
            log_output.push(<tr key={i}><td>{log_record.timestamp}</td><td>{log_record.logger}</td><td>{log_record.severity}</td>{log_msg}</tr>)
            ++i;
        }
        
        return (<div className='col-xs-12'>
                    <row>
                    <div className="col-xs-12 text-center" style={{float: "none", margin: "0 auto"}}>
                    <nav>
                        <ul className="pagination">
                            <li>
                                <a href="#" onClick={this.firstPageClicked.bind(this)}>
                                    <span aria-hidden="true">first</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={this.previousClicked.bind(this)}>
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            {pages}
                            <li>
		                <a href="#" onClick={this.nextClicked.bind(this)}>
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                            <li>
		                <a href="#" onClick={this.lastPageClicked.bind(this)}>
                                    <span aria-hidden="true">{"last"+(this.state.last_page<this.state.total_pages ? " ("+this.state.total_pages+")" : "")}</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                    </div>
                    </row>
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
                            {log_output}
                        </tbody>
                    </table>
                    </div>
                    </row>
               </div>)
    }
}
