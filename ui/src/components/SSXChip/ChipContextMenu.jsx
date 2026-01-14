import { contextMenu, Item, Menu, Separator } from 'react-contexify';

export default function ChipContextMenu({ onMoveTo, onAddTask }) {
  return (
    <Menu id="chip-context-menu">
      <li aria-level="2" className="dropdown-header">
        <b>Chip</b>
      </li>
      <Separator />
      <Item id="moveto" data={{}} onClick={onMoveTo}>
        Move to
      </Item>
      <Item id="addtask" data={{}} onClick={onAddTask}>
        Add to queue
      </Item>
    </Menu>
  );
}

export function showContextMenu(event, selection) {
  contextMenu.show({
    id: 'chip-context-menu',
    event: event.e,
    props: {
      selection,
    },
  });
}
