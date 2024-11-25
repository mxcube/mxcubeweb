import React, { useEffect, useState } from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { BsList } from 'react-icons/bs';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { showProposalsForm, signOut } from '../../actions/login';
import styles from './MXNavbar.module.css';

function MXNavbar() {
  const isUserLogin = useSelector((state) => state.login.loginType === 'User');
  const selectedProposal = useSelector((state) => state.login.selectedProposal);
  const { nickname, fullname } = useSelector((state) => state.login.user);
  const inControl = useSelector((state) => state.login.user.inControl);

  const mode = useSelector((state) => state.general.mode);
  const numObservers = useSelector(
    (state) => state.remoteAccess.observers.length,
  );

  const [expanded, toggle] = useState(false);
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    toggle(false); // collapse mobile nav when navigating
  }, [pathname]);

  useEffect(() => {
    document.title = `MxCuBE-Web – ${selectedProposal}`;
  }, [selectedProposal]);

  return (
    <Navbar
      className={styles.navBar}
      bg="dark"
      variant="dark"
      expand="xl"
      expanded={expanded}
      onToggle={toggle}
    >
      <Container fluid>
        <Navbar.Brand as="h1" className={styles.brand}>
          MXCuBE-Web <span className={styles.brandSub}>({mode})</span>
        </Navbar.Brand>
        <Navbar.Toggle
          bsPrefix={styles.toggleBtn}
          aria-controls="responsive-navbar-nav"
        >
          <BsList size="2em" />
        </Navbar.Toggle>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className={styles.mainNav}>
            <Nav.Link as={NavLink} className={styles.navLink} to="/samplegrid">
              Samples
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              className={styles.navLink}
              to="/datacollection"
            >
              Data collection
            </Nav.Link>
            <Nav.Link as={NavLink} className={styles.navLink} to="/equipment">
              Equipment
            </Nav.Link>
          </Nav>
          <Nav className={styles.subNav}>
            <Nav.Link as={NavLink} className={styles.navLink} to="/help">
              <span className="me-2 fas fa-lg fa-question-circle" />
              Help
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              className={styles.navLink}
              to="/remoteaccess"
            >
              <span
                className={styles.remoteIcon}
                data-in-control={inControl || undefined}
              >
                <span className="fas fa-lg fa-globe" />
                {numObservers > 0 && (
                  <span className={styles.numObservers}>{numObservers}</span>
                )}
              </span>
              Remote
            </Nav.Link>
            {isUserLogin && (
              <button
                className={styles.navBtn}
                type="button"
                onClick={() => {
                  toggle(false);
                  dispatch(showProposalsForm());
                }}
              >
                <span className="me-2 fas fa-lg fa-bars" />
                Session
                <span className={styles.parens}> ({selectedProposal})</span>
              </button>
            )}
            <button
              className={styles.navBtn}
              type="button"
              onClick={() => dispatch(signOut())}
            >
              <span className="me-2 fas fa-lg fa-sign-out-alt" />
              Sign out
              <span className={styles.parens}>
                {' '}
                ({isUserLogin ? fullname : nickname})
              </span>
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MXNavbar;
