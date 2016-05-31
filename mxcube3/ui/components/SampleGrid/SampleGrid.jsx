import ReactDOM from 'react-dom';
import React from 'react';
import SampleGridItem from './SampleGridItem';
import Isotope from 'isotope-layout';

import './SampleGrid.css';


export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
    this.filter = this.filter.bind(this);
  }


  componentDidMount() {
    if (! this.isotope) {
      const container = ReactDOM.findDOMNode(this);
      const options = { itemSelector: '.samples-grid-item',
                        layoutMode: 'masonry',
                        masonry: { isFitWidth: true } };

      this.isotope = new Isotope(container, options);
    }
  }


  componentDidUpdate(prevProps) {
    if (this.isotope) {
      if ((this.props.filter_text !== prevProps.filter_text) ||
          (this.props.samples_list !== prevProps.samples_list)) {
        this.isotope.reloadItems();
        this.isotope.layout();
      }
      this.isotope.arrange();
    }
  }


  filter(key) {
    const sample = this.props.samples_list[key];
    let sampleFilter = `${sample.sampleName} ${sample.proteinAcronym} `;
    sampleFilter += `${sample.code} ${sample.location.toLowerCase()}`;

    return sampleFilter.includes(this.props.filter_text.toLowerCase());
  }


  render() {
    const samplesList = this.props.samples_list;
    let [sampleGrid, i] = [[], 0];

    Object.keys(samplesList).forEach(key => {
      if (this.filter(key)) {
        const sample = samplesList[key];
        const [acronym, name, tags] = [sample.proteinAcronym, sample.sampleName, []];

        for (const id in sample.tasks) {
          tags.push(sample.tasks[id]);
        }

        sampleGrid.push(
          <SampleGridItem
            ref={i} key={key} selectKey={key} sampleID={sample.id}
            acronym={acronym} name={name} dm={sample.code}
            loadable={false} location={sample.location} tags={tags}
            selected={this.props.selected[key]}
            deleteTask={this.props.deleteTask}
            showTaskParametersForm={this.props.showTaskParametersForm}
            onClick={this.props.toggleSelected}
          />
        );

        ++i;
      }
    });

    return (
      <div className="samples-grid">
        {sampleGrid}
      </div>
    );
  }
}


SampleGrid.propTypes = {
  filter_text: React.PropTypes.string,
  toggleSelected: React.PropTypes.func.isRequired
};
