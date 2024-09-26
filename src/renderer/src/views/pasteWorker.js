// pasteWorker.js

// Basic email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
  
  self.onmessage = function (event) {
    const { pastedData } = event.data;
    let pastedItems = [];
    let removedItems = [];
  
    // Split pasted data using semicolons or colons as delimiters
    pastedItems = pastedData.split(/[\s;,:|/\\<>]+/);
  
    // If there are no items after splitting, it means the data might be from Excel, so it is split using tabs or commas as delimiters
    if (pastedItems.length === 1) {
      pastedItems = pastedData.split(/[\t,]+/);
    }
  
    // Clean up each item by removing double quotes and trimming whitespace
    pastedItems = pastedItems.map(item => item.replace(/"/g, '').trim());
  
    // Filter out items that are not valid email addresses and add them to removedItems
    pastedItems = pastedItems.filter((item) => {
      if (isValidEmail(item)) {
        return true;
      } else {
        removedItems.push(item);
        return false;
      }
    });
  
    self.postMessage({ pastedItems, removedItems });
  };