import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setLogPage } from '../actions/logger';

export class LoggerContainer extends React.Component {
  constructor(props) {
    super(props);
    this.firstPage = props.setLogPage.bind(this, 0);
    this.lastPage = this.lastPage.bind(this);
    this.backwardPage = this.changePage.bind(this, -1);
    this.forwardPage = this.changePage.bind(this, 1);
  }

  changePage(amount) {
    const newPage = this.props.page + amount;
    if (newPage >= 0 && newPage <= Math.floor(this.props.records.length / 20)) {
      this.props.setLogPage(newPage);
    }
  }

  lastPage() {
    this.props.setLogPage(Math.floor(this.props.records.length / 20));
  }

  render() {
    const { records, page } = this.props;

    const filteredRecords = records.slice(page * 20, page * 20 + 20).map((record, index) => (
      <tr key={index}>
        <td>{record.timestamp}</td>
        <td>{record.logger}</td>
        <td>{record.severity}</td>
        <td>{record.message}</td>
      </tr>
    ));

    return (
      <div className="col-xs-12">
        <row>
          <div className="col-xs-12 text-center" style={{ float: 'none', margin: '0 auto' }}>
            <nav>
              <ul className="pagination">
                <li>
                  <a onClick={this.firstPage}>
                    <span aria-hidden="true">first</span>
                  </a>
                </li>
                <li>
                  <a onClick={this.backwardPage}>
                    <span aria-hidden="true">&laquo;</span>
                  </a>
                </li>
                <li><a>{page}</a></li>
                <li>
                  <a onClick={this.forwardPage}>
                    <span aria-hidden="true">&raquo;</span>
                  </a>
                </li>
                <li>
                  <a onClick={this.lastPage}>
                    <span aria-hidden="true">last</span>
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
                {filteredRecords}
              </tbody>
            </table>
          </div>
        </row>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    records: state.logger.logRecords,
    page: state.logger.activePage
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setLogPage: bindActionCreators(setLogPage, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoggerContainer);
