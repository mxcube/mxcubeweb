import React, { useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
// TO BE CONTINUED
const CollapseHorizontal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Row className="flex items-center">
      {/* Toggle Button */}
      <Col sm={1}>
        <Button
          className="p-2 text-white rounded-l"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '<<' : '>>'}
        </Button>
      </Col>

      {/* Collapsible Panel */}
      <Row
        className="overflow-hidden transition-all duration-300 ease-in-out bg-gray-200 p-2 shadow-md"
        style={{
          maxWidth: isOpen ? 'max-content' : '0px',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </Row>
    </Row>
  );
};

export default CollapseHorizontal;
