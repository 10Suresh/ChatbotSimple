// components/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Container, Row, Col, Spinner } from 'react-bootstrap';
import toast, { Toaster } from 'react-hot-toast';
import { FaUser, FaRobot } from 'react-icons/fa';

const Chatbot = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([{ sender: 'bot', message: 'How can I help you?' }]);
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userMessage = { sender: 'user', message: question };
      setChatHistory((prev) => [...prev, userMessage]);
      setQuestion('');

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      if (response.ok) {
        const botMessage = { sender: 'bot', message: data.response };
        setChatHistory((prev) => [...prev, botMessage]);
        toast.success('Answer fetched successfully!');
      } else {
        toast.error('Error fetching answer.');
      }
    } catch (error) {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    chatHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <Container className="my-5">
      <Toaster />
      <Row className="justify-content-center">
        <Col md={8} lg={4}>
          <div className="p-2 shadow-sm d-flex bg-dark flex-column" style={{ height: '90vh', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="d-flex flex-column justify-content-between h-100">
              <div className="chat-title">
                <h3 className="text-center mb-2 text-white">CYBROM CHATBOT</h3>
              </div>
              <div
                className="chatHistory "
                style={{
                  flexGrow: 1,
                  overflowY: 'scroll',
                  padding: '8px',
                  msOverflowStyle: 'none',  
                  scrollbarWidth: 'none' 
                }}
              >
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`p-2 my-3 rounded ${chat.sender === 'bot' ? 'bg-light' : 'bg-secondary text-white text-end'}`}>
                    <div className={`${chat.sender === 'bot' ? 'd-flex align-items-center' : 'd-flex align-items-center justify-content-end'}`}>
                      <div>
                        {chat.sender === 'bot' ? <FaRobot className="me-2 fs-4" style={{ width: '24px', height: '24px' }} /> : <FaUser className="ms-2 fs-4" style={{ width: '24px', height: '24px' }}/>}
                      </div>
                      <p className={`${chat.sender === 'bot' ? '' : 'text-end'} m-0 p-2`}>{chat.message}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="p-2 my-3 rounded bg-light text-center">
                    <Spinner animation="border" />
                  </div>
                )}
                <div ref={chatHistoryRef}></div>
              </div>
              <div className='p-2'>
                <Form onSubmit={handleSubmit} className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Enter your question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="me-2"
                    required
                  />
                  <Button variant="primary" type="submit">
                    Send
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Chatbot;
