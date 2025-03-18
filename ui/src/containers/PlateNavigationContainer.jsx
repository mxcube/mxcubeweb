

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Table } from 'react-bootstrap';
import './PlateNavigationContainer.css';

const PlateNavigationContainer = () => {
    const rows = ['A','B','C','D','E','F','G','H'];
    const cols = 12;

    const renderTable = () => {
        return rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                    <td key={colIndex}>
                        <Button variant="primary">
                            {`${row}-${colIndex + 1}`}
                        </Button>
                    </td>
                ))}
            </tr>
        ));
    };

    return (
        <>
            <div>
                <b>Navigation:</b>
            </div>            
            <div className="container mt-1 plate-navi-table-container">
                <Table bordered>
                    <tbody>{renderTable()}</tbody>
                </Table>
            </div>
            <div></div>
        
        </>
        
    );
};

export default PlateNavigationContainer;