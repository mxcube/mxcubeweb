/** @jsx React.DOM */
/* global $*/
/* eslint-disable no-console */
'use strict';


// Global variables for this applicaiton
var SAMPLETREE = {

        SingleSampleTree: null,

        EditableField: null,

        params: {
            Characterisation : {
                osc_range: { label: 'Oscillation range', default_value: 0.1 },
                osc_start: { label: 'Oscillation start', default_value: 0 },
                exp_time: { label: 'Exposure time', default_value: 0.02 },
                n_images: { label: 'Number of images', default_value: 1 } } ,
            StandardCollection : {
                osc_range: { label: 'Oscillation range', default_value: 0.1 },
                osc_start: { label: 'Oscillation start', default_value: 0 },
                exp_time: { label: 'Exposure time', default_value: 0.02 },
                n_images: { label: 'Number of images', default_value: 1 } },
            SampleCentring : {
                center_points: {
                    label: 'Centring status',
                    default_value: 'False' },
                n_images: {
                    label: 'Number of images',
                    default_value: 1 }
            }
        },

        queueInfo: {
            sampleID: '42',

            // status: 0 not done, 1 done, 2 failed
            list: [
                {
                    name: 'SampleCentring_1',
                    status: 0,
                    params: {},
                    queueID: 1
                },
                {
                    name: 'Characterisation_1',
                    status: 1,
                    params: {},
                    queueID: 2
                },
                {
                    name : 'SampleCentring_1',
                    status: 0,
                    params: {},
                    queueID: 3
                },
                {
                    name: 'StandardCollection_1',
                    status: 2,
                    params: {},
                    queueID: 4
                }
            ]
        }
    },

    // Objects from external javascript libraries
    React;


SAMPLETREE.SingleSampleTree = React.createClass({


    getInitialState: function() {
        console.log('SAMPLETREE.SingleSampleTree getInitialState called');

        return SAMPLETREE.queueInfo;
    },


    addQueueItem: function(newItem) {

        SAMPLETREE.queueInfo.list.push(
            {
                name: this.generateElementId(newItem['kind']),
                status: 0,
                params: {},
                queueID: SAMPLETREE.queueInfo.list.length + 1
            }
        );

        this.setState({list: SAMPLETREE.queueInfo.list});
    },


    removeQueueItem: function(itemToRemove) {

        var i, index = 0;

        console.log('itemToRemove: ' + itemToRemove);
        console.log('length: ' + SAMPLETREE.queueInfo.list.length);

        // Search for the array index of item in the list that should be
        // removed
        for (i = 0; i < SAMPLETREE.queueInfo.list.length; i += 1) {

            if (SAMPLETREE.queueInfo.list[i].queueID === itemToRemove) {
                index = i;
                console.log('will remove: ' +
                    SAMPLETREE.queueInfo.list[i].name);
            }
        }

        if (index >= 0) {
            // Remove the item with the array index found
            SAMPLETREE.queueInfo.list.splice(index, 1);

            // Change the queue item indicies where needed
            for (i = 0; i < SAMPLETREE.queueInfo.list.length; i += 1) {

                if (SAMPLETREE.queueInfo.list[i].queueID > itemToRemove) {
                    SAMPLETREE.queueInfo.list[i].queueID -= 1;
                }
            }

            this.setState({list: SAMPLETREE.queueInfo.list});
        }
    },


    runThisItem: function(item) {
        console.log(item);
    },


    componentWillMount: function() {
        window.app_dispatcher.on('queue:new_item', this.addQueueItem);
        this.getInitialState();
    },


    componentWillUnMount: function() {
        window.app_dispatcher.off('queue:new_item', this.addQueueItem);
    },


    aMethod: function() {
        console.log('aMethod Called');
    },


    formatParameters: function(paramType) {

        var fields = [], key, paramDict, value, name;

        // fields.push( <EditableField key={fieldno}
        //    sampleid={this.props.sample.sampleId}
        //    name={field} value={value} /> );

        paramDict = SAMPLETREE.params[paramType.split('_')[0]];

        for (key in paramDict) {
            value = paramDict[key]['default_value'];
            name = paramDict[key]['label'];
            fields.push(
                <SAMPLETREE.EditableField name={name} value={value} />);
        }
        return fields;
    },


    formatStatus: function(status) {
        switch (status) {
        case 0: return 'fa fa-fw fa-circle-o';
        case 1: return 'fa fa-fw fa-check-circle-o';
        case 2: return 'fa fa-fw fa-exclamation-circle';
        }
    },


    generateElementId: function(newElement) {
        var occurrences = 0, i;

        for (i = 0; i < this.state.list.length; i += 1) {

            if (this.state.list[i].name.split('_')[0] === newElement) {
                occurrences += 1;
            }
        }

        return newElement + '_' + (occurrences + 1);
    },


    render: function() {

        console.log('rendering queue items');

        var that = this, arr = [], key;

        this.getInitialState();

        for (key in this.state.list) {
            arr.push(this.state.list[key]);
        }

        return (

            <div className='col-xs-12'>
                <div className='panel panel-info'>

                    <div className='panel-heading'>
                        <h1 className='panel-title'>Queue</h1>
                    </div>

                    <div className='panel-body'>

                        <div className='col-xs-5 col-xs-offset-2'>

                            <button type='button'
                                className='btn btn-block btn-success'
                                onClick={this.aMethod}>Run
                                <i className='fa fa-play-circle fa-fw'></i>
                            </button>

                        </div>

                        <div className='col-xs-5'>

                            <button type='button'
                                className='btn btn-block btn-danger'
                                onClick={this.aMethod}>Stop
                                <i className='fa fa-stop fa-fw'></i>
                            </button>

                        </div>

                        <div className='col-xs-12 text-center'>
                            <b>Sample {SAMPLETREE.queueInfo.sampleID}</b>
                        </div>

                        {arr.map(function(listValue) {

                            return (
                                <div className='text-left col-xs-12 queue-list'>

                                    <div className="col-xs-5 queue-list">
                                        <b>{listValue.queueID}. </b>

                                        <a data-toggle='collapse'
                                            className='queue-list'
                                            href={'#collapse' +
                                                listValue.name} >
                                                {listValue.name}
                                        </a>

                                        <div className='collapse'
                                            id={'collapse' + listValue.name}>
                                            <div className='well'>
                                                {that.formatParameters(
                                                    listValue.name)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='text-right col-xs-7'>

                                        <button type='button'
                                                className='btn btn-link
                                                queue-list'
                                                onClick={
                                                    that.removeQueueItem.bind(
                                                        that,
                                                        listValue.queueID
                                                    )
                                                }>
                                            <i className='fa fa-fw fa-eraser'>
                                            </i>
                                        </button>

                                        <button type='button'
                                                className='btn btn-link'
                                                onClick={that.runThisItem.bind(
                                                    that,listValue.name)}>
                                            <i className='fa fa-fw fa-play-circle'>
                                            </i>
                                        </button>

                                        <button type='button'
                                                className='btn btn-link'
                                                onClick={that.aMethod}>
                                            <i className={that.formatStatus(
                                                listValue.status)}></i>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>
            </div>
        );
    }
});


SAMPLETREE.EditableField = React.createClass({


    componentDidMount: function() {
        $(this.refs.editable.getDOMNode()).editable();
    },


    render: function() {
        return <p>{this.props.name}:
                <a href='#' ref='editable' data-name={this.props.name}
                    data-pk={this.props.id} data-url='/beam_line_update'
                    data-type='text' data-title='Edit value'>
                    {this.props.value}
                </a>
            </p>;
    }
});
