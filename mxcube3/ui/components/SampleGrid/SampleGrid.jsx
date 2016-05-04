import ReactDOM from 'react-dom';
import React from 'react';
import './SampleGrid.css';
import SampleGridItem from './SampleGridItem';
import Isotope from 'isotope-layout';

export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
    this.filter = this.filter.bind(this);
  }

  componentDidMount() {
    if (! this.isotope) {
      let container = ReactDOM.findDOMNode(this);
      this.isotope = new Isotope(container, { itemSelector: '.samples-grid-item', layoutMode: 'masonry', masonry: { isFitWidth: true } });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.isotope) {
      if ((this.props.filter_text != prevProps.filter_text) || (this.props.samples_list != prevProps.samples_list)) {
        this.isotope.reloadItems();
        this.isotope.layout();
      }
      this.isotope.arrange();
    }
  }

  filter(key) {
    let sampleData = this.props.samples_list[key];
    let sampleFilter = (sampleData.sampleName + ' ' + sampleData.proteinAcronym + ' ' + sampleData.code + ' ' + sampleData.location).toLowerCase();
    return sampleFilter.includes(this.props.filter_text.toLowerCase());
  }

  render() {
    var samples_list = this.props.samples_list;
    var sample_grid = [];
    var i = 0;
    Object.keys(samples_list).forEach(key => {
      if (this.filter(key)) {
        let sample = samples_list[key];
        let acronym = sample.proteinAcronym;
        let name = sample.sampleName;
        let tags = [];
        for (let id in sample.tasks) {
          tags.push(sample.tasks[id]); // .name);
        }
        sample_grid.push(<SampleGridItem ref={i} key={key} selectKey={key} sample_id={sample.id} acronym={acronym} name={name} dm={sample.code} loadable={false} location={sample.location} tags={tags} selected={this.props.selected[key] ? true : false} deleteTask={this.props.deleteTask} showTaskParametersForm={this.props.showTaskParametersForm} onClick={this.props.toggleSelected} />);
        ++i;
      }
    });
    return (<div className="samples-grid">
                  {sample_grid}
             </div>);
  }
}

SampleGrid.propTypes = {
  filter_text: React.PropTypes.string,
  toggleSelected: React.PropTypes.func.isRequired
};

