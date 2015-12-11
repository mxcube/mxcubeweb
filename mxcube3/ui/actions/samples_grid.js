import fetch from 'isomorphic-fetch'

export function doUpdateSamples(samples_list) {
    return { type: "UPDATE_SAMPLES", samples_list }
}

export function doGetSamplesList() {
   return function(dispatch) {
       window.please_wait_dialog.show();
       fetch('mxcube/api/v0.1/sample_changer/samples_list')
            .then(response => response.json())
            .then(json => {
                window.please_wait_dialog.hide();
                dispatch(doUpdateSamples(json));
            })
    }
}

export function doSetLoadable(loadable) {
    return { type: "SET_LOADABLE", loadable }
}

export function doAddTag(tag) {
    return { type: "ADD_TAG", tag }
}

export function doToggleSelected(index) {
    return { type: "TOGGLE_SELECTED", index }
}

export function doSelectAll() {
    return { type: "SELECT_ALL" }
}

export function doFilter(filter_text) {
    return { type: "FILTER",  filter_text }
}

