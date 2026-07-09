import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

import { hideMenu } from '../../reducers/contextMenu';
import { useAppSelector } from '../../ts-store';
import styles from './MXContextMenu.module.css';

export default function MXContextMenu(props: React.PropsWithChildren) {
  const { children } = props;
  const contextMenu = useAppSelector((state) => state.contextMenu);
  const show = contextMenu.type === 'Generic';
  const { id, x, y } = show ? contextMenu : { id: '', x: 0, y: 0 };
  const dispatch = useDispatch();
  const menuRef = useRef<HTMLDivElement>(null);
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
    function onDocumentClick() {
      dispatch(hideMenu());
    }
    document.addEventListener('click', onDocumentClick);
    return () => {
      document.removeEventListener('click', onDocumentClick);
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
