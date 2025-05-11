const convertDraftOrder = (orderID, orderStatus) => {
  if (orderID.startsWith('DR') && orderStatus !== 'draft') {
    return orderID.replace('DR', 'CS');
  }
  return orderID;
}

module.exports = convertDraftOrder