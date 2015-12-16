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
        this.npages = 10;
        this.records_per_page = 2;
        this.state = { log_records: [], curr_page: 1, start_page: 1, last_page: 1, total_pages: 0 };
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
        while (((this.state.last_page-this.state.start_page)<(this.npages-1))&&(this.state.last_page < this.state.total_pages)) {
            this.state.last_page++;
        }                                      
        for (i = this.state.start_page; i <= this.state.last_page; i++) {
            let active = i==this.state.curr_page ? "active" : "";
            pages.push(<li className={active} key={i}><a href="#" onClick={this.pageClicked.bind(this, i)}>{i}</a></li>);
        }
 
        i = 0;
        for (log_record of this.state.log_records.slice((this.state.curr_page-1)*this.records_per_page, this.state.curr_page*this.records_per_page)) {
            log_output.push(<pre key={i} style={{margin: "0px", border: "0px"}}>{log_record.message}</pre>)
            ++i;
        }
        
        return (<div className='col-xs-12'>
                    <nav>
                        <ul className="pagination">
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
                        </ul>
                    </nav>
                    {log_output}
               </div>)
    }
}
