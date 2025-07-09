import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { showGenericContextMenu } from '../../actions/sampleGrid';
import styles from './MXContextMenu.module.css';

export default function MXContextMenu(props) {
  const { children } = props;
  const { show, x, y, id } = useSelector(
    (state) => state.contextMenu.genericContextMenu,
  );
  const dispatch = useDispatch();
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (show && menuRef.current) {
      const menu = menuRef.current;
      const windowWidth = document.body.offsetWidth;
      const menuEndXPos = x + menu.offsetWidth;

      const posxoffset = menuEndXPos > windowWidth ? menu.offsetWidth + 10 : 10;

      setPosition({
        x: x - posxoffset,
        y: y - 70,
      });
    }
  }, [show, x, y]);

  useEffect(() => {
    function hideContextMenu() {
      dispatch(showGenericContextMenu(false, null, 0, 0));
    }
    document.addEventListener('click', hideContextMenu);
    return () => {
      document.removeEventListener('click', hideContextMenu);
    };
  }, [dispatch]);

  return (
    <Dropdown.Menu
      className={styles.genericContextMenu}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      show={show}
      id={id}
      role="menu"
      ref={menuRef}
    >
      {children}
    </Dropdown.Menu>
  );
}
