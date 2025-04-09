const formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

module.exports = {
  formatCurrency,
  getCurrentDate,
};
