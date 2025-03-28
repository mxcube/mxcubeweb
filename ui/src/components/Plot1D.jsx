import React from 'react';
import { connect } from 'react-redux';
import Dygraph from 'dygraphs';
import 'dygraphs/dist/dygraph.min.css';

class Plot1D extends React.Component {
  static defaultProps = {
    autoNext: true,
    plotId: null,
    displayedPlotCallback: null,
    saved: false,
    data: null,
  };

  constructor(props) {
    super(props);

    this.clearPlot = this.clearPlot.bind(this);
    this.setPlot = this.setPlot.bind(this);

    this.dygraph = null;
    this.state = { plotId: null };
  }

  componentDidMount() {
    if (this.props.plotId) {
      this.setState({ plotId: this.props.plotId });
    }
  }

  // eslint-disable-next-line react/no-unsafe
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.autoNext) {
      if (this.state.plotId !== null) {
        if (nextProps.lastPlotId !== this.state.plotId) {
          const currentPlotInfo = nextProps.plotsInfo[this.state.plotId];
          if (currentPlotInfo.end) {
            // display next plot
            this.setPlot(nextProps.lastPlotId);
          }
        }
      } else {
        const plotId = nextProps.lastPlotId;
        const plotInfo = nextProps.plotsInfo[plotId];
        if (plotInfo && plotInfo.end) {
          // do not display an old plot
          return;
        }

        this.setPlot(plotId);
      }
    }
  }

  // eslint-disable-next-line react/no-unsafe
  UNSAFE_componentWillUpdate(nextProps, nextState) {
    const { plotId } = nextState;
    if (plotId) {
      const plotInfo = nextProps.plotsInfo[plotId];
      const plotData = nextProps.plotsData[plotId];

      if (this.dygraph) {
        this.dygraph.updateOptions({ file: plotData });
      } else if (nextProps.saved) {
        this.dygraph = new Dygraph(this.dygraph_div, nextProps.data, {
          title: 'XRF Scan',
          labels: ['energy', 'diode value'],
          xlabel: 'Energy (keV)',
          ylabel: 'Counts',
        });
      } else {
        this.dygraph = new Dygraph(this.dygraph_div, plotData, {
          title: plotInfo.title,
          labels: plotInfo.labels,
          connectSeparatedPoints: true,
          xlabel: 'Energy (keV)',
          ylabel: 'Counts',
        });
      }
    }
  }

  componentWillUnmount() {
    this.clearPlot();
  }

  setPlot(plotId) {
    this.clearPlot();

    this.setState({ plotId });

    if (this.props.displayedPlotCallback) {
      // tell parent we are displaying this plot
      this.props.displayedPlotCallback(plotId);
    }
  }

  clearPlot() {
    if (this.dygraph) {
      this.dygraph.destroy();
    }

    this.dygraph = null;
  }

  render() {
    return (
      <div
        ref={(ref) => {
          this.dygraph_div = ref;
        }}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    lastPlotId: state.beamline.lastPlotId,
    plotsInfo: state.beamline.plotsInfo,
    plotsData: state.beamline.plotsData,
  };
}

export default connect(mapStateToProps, null)(Plot1D);
