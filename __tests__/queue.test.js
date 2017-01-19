import { clearAll } from '../mxcube3/ui/actions/queue';
import reducer from '../mxcube3/ui/reducers/queue';
import { QUEUE_STOPPED, SAMPLE_UNCOLLECTED } from '../mxcube3/ui/constants';


describe('queue actions', () => {
  it('should create an action to clear queue', () => {
    const expectedAction = {
      type: 'CLEAR_ALL',
    }
    expect(clearAll()).toEqual(expectedAction)
  })
})


describe('queue reducer', () => {

  it('should return the initial state', () => {
    expect(
      reducer(undefined, {})
    ).toEqual(
      {
		  queue: {},
		  current: { node: null, running: false },
		  searchString: '',
		  queueStatus: QUEUE_STOPPED,
		  showResumeQueueDialog: false,
		  visibleList: 'current'
      }
    )
  })

  it('should handle CLEAR_QUEUE', () => {
    expect(
      reducer(
      	{
		  queue: {1: "dadas", 2: "adsad"},
		  current: { node: null, running: false },
		  searchString: '',
		  queueStatus: QUEUE_STOPPED,
		  showResumeQueueDialog: false,
		  visibleList: 'current'
      }, {
        type: 'CLEAR_QUEUE',
      })
    ).toEqual(
      {
		  queue: {},
		  current: { node: null, running: false },
		  searchString: '',
		  queueStatus: QUEUE_STOPPED,
		  showResumeQueueDialog: false,
		  visibleList: 'current'
      }
    )
	})
})