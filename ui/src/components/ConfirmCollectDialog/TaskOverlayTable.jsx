import { Table } from 'react-bootstrap';

export default function TaskOverlayTable(props) {
  const { task } = props;

  if (task.type === 'energy_scan') {
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Element</th>
            <th>Edge</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{task.parameters.element}</td>
            <td>{task.parameters.edge}</td>
          </tr>
        </tbody>
      </Table>
    );
  }
  if (task.type === 'xrf_spectrum') {
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Integration Time (s)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{task.parameters.exp_time}</td>
          </tr>
        </tbody>
      </Table>
    );
  }
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Osc. start</th>
          <th>Osc. range</th>
          <th>Exp time</th>
          <th>Resolution</th>
          <th>Transmission</th>
          <th>Energy</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{task.parameters.osc_start}</td>
          <td>{task.parameters.osc_range}</td>
          <td>{task.parameters.exp_time}</td>
          <td>{task.parameters.resolution}</td>
          <td>{task.parameters.transmission}</td>
          <td>{task.parameters.energy}</td>
        </tr>
      </tbody>
    </Table>
  );
}
