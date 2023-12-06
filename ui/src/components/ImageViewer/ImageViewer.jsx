import React from 'react';
import './ImageViewer.css';
// import PinchZoomPan from "react-responsive-pinch-zoom-pan";

// Component for gallery image
class GalleryImage extends React.Component {
  render() {
    return (
      <img
        className={`image_galery_view ${this.props.className}`}
        src={this.props.src}
        alt={this.props.alt}
      />
    );
  }
}

// Component for gallery modal
class GalleryModal extends React.Component {
  render() {
    if (this.props.isOpen === false) {
      return null;
    }

    return (
      <div
        // isOpen={this.props.isOpen}
        className="modal-overlay"
        // name={this.props.name}
      >
        <div className="viewer-modal-body">
          <a
            className="viewer-modal-close"
            href="#"
            onClick={this.props.onClick}
          >
            <span className="fa fa-times"></span>
          </a>
          {/* <svg width="100%" height="100%"> */}
          {/* <rect width="100%" height="100%" fill="green" /> */}
          {/* <image xlinkHref={this.props.src} alt="cry" /> */}
          {/* <PinchZoomPan maxScale={1000}> */}
          <svg width="573" height="480" viewBox="0 0 100% 100%">
            <image className="image_modale_view" xlinkHref={this.props.src} />
            <rect
              className="image_modale_vie"
              x={573 - this.props.imgTargetX - 222}
              y={480 - this.props.imgTargetY - 186}
              width="40"
              height="20"
              fill="red"
            />
            {/* <line x1="0" y1="80" x2="100" y2="20" stroke="black" /> */}
          </svg>
          {/* <img className='image_modal_view'src={this.props.src} /> */}
          {/* </PinchZoomPan> */}

          {/* <svg width="573" height="480" viewBox="0 0 100% 100%">
            <image className='image_modal_view' xlinkHref={this.props.src} />
            <rect width="20" height="20" fill="green" x={473 - this.props.imgTargetX} y={380 - this.props.imgTargetY} />
          </svg> */}
          {/* <img className='image_modal_view'src={this.props.src} /> */}
          <span className="label label-info">
            {this.props.imgTargetX}
            <br />
            {this.props.imgTargetY}
          </span>
          {/* </svg> */}
        </div>
      </div>
    );
  }
}

// Component for gallery
export default class ImageViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      isOpen: false,
      url: '',
    };

    this.openModal = this.openModal.bind(this);

    this.closeModal = this.closeModal.bind(this);
  }

  render() {
    return this.props.galleryView ? (
      <div
        refs="gallery-container"
        className="container-fluid gallery-container"
      >
        <div className="row">
          {this.props.imgUrls.map((url, index) => {
            return (
              <div className="col-sm-6 col-md-3 col-xl-2">
                <div className="gallery-card">
                  <GalleryImage
                    className="gallery-thumbnail"
                    src={url}
                    alt={this.props.imgAlt}
                  />
                  <span
                    className="card-icon-open fa fa-expand"
                    value={url}
                    onClick={(e) => this.openModal(url, e)}
                  ></span>
                </div>
              </div>
            );
          })}
        </div>
        <GalleryModal
          isOpen={this.state.showModal}
          onClick={this.closeModal}
          src={this.state.url}
        />
      </div>
    ) : (
      <div>
        <div className="gallery-card">
          <GalleryImage
            className="gallery-thumbnail img-responsive"
            src={this.props.imgUrl}
            alt={this.props.imgAlt}
          />
          <span
            className="card-icon-open fa fa-expand"
            value={this.props.imgUrl}
            onClick={(e) => this.openModal(this.props.imgUrl, e)}
          ></span>
        </div>
        <GalleryModal
          isOpen={this.state.showModal}
          onClick={this.closeModal}
          src={this.state.url}
          imgTargetX={this.props.imgTargetX}
          imgTargetY={this.props.imgTargetY}
        />
      </div>
    );
  }

  // Function for opening modal dialog
  openModal(url, e) {
    this.setState({
      showModal: true,
      url: url,
    });
  }

  // Function for closing modal dialog
  closeModal() {
    this.setState({
      showModal: false,
      url: '',
    });
  }
}

// // Let's render the whole thing
// ReactDOM.render(
//   <Gallery imgUrls={imgUrls} />
// , galleryContainer);
