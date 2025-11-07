# TODO: Implement Important Payment Fixes

## 🔄 Order Status Consistency
- [ ] Add status validation in PaymentModal.jsx
- [ ] Ensure webhook correctly updates status transitions
- [ ] Add status transition checks in server.js

## 🚨 Payment Error Handling
- [ ] Enhance error categorization in PaymentModal.jsx
- [ ] Add user-friendly error messages
- [ ] Improve retry logic with exponential backoff

## 📊 Transaction Logging
- [ ] Modify logger.js to persist logs to Firestore 'transactionLogs' collection
- [ ] Integrate detailed logging in server.js for all payment events

## ⏰ Payment Timeout Handling
- [ ] Add function in server.js to cancel pending orders after 24 hours
- [ ] Restore inventory on timeout
- [ ] Notify users of cancelled orders
