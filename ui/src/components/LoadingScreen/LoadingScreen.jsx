import logo from '../../img/mxcube_logo20.png';
import loadingAnimation from '../../img/loading-animation.gif';
import styles from './LoadingScreen.module.css';

function LoadingScreen() {
  return (
    <div className={styles.root}>
      <img className={styles.logo} src={logo} width="159" alt="MXCuBE" />
      <p className={styles.message}>Loading, please wait</p>{' '}
      <img src={loadingAnimation} width="100" alt="" />
    </div>
  );
}

export default LoadingScreen;
