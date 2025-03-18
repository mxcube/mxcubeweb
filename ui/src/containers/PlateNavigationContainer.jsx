import React, { useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import './PlateNavigationContainer.css';
import { loadPlateSample } from '../actions/plateManiuplator';
import { useDispatch} from "react-redux";

const PlateNavigationContainer = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const cols = 12;
    // 使用一个字符串来记录当前选中按钮的标识，初始为 null 表示没有选中的按钮
    const [selectedButton, setSelectedButton] = useState(null);
    const dispatch = useDispatch();

    const handleButtonClick = (rowIndex, colIndex) => {
        // 生成当前按钮的唯一标识
        const buttonId = `${rowIndex + 1}:${colIndex + 1}`;
        console.log('buttonId')
        console.log(buttonId)
        // 更新选中按钮的标识
        setSelectedButton(buttonId);
        dispatch(loadPlateSample(buttonId))

    };

    const renderTable = () => {
        return rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => {
                    const buttonId = `${rowIndex + 1}:${colIndex + 1}`;
                    const isSelected = selectedButton === buttonId;
                    return (
                        <td key={colIndex}>
                            <Button
                                variant={isSelected ? 'primary' : 'outline-secondary'}
                                onClick={() => handleButtonClick(rowIndex, colIndex)}
                            >
                                {row}-{colIndex+1}
                            </Button>
                        </td>
                    );
                })}
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