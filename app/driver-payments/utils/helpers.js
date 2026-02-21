// Helper functions for driver payments

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('en-CA');
};

export const getStatusColor = (status) => {
  switch (status) {
    case "DRAFT": return "warning";        // orange
    case "FINALIZED": return "info";       // blue
    case "POSTED": return "primary";       // dark blue
    case "PROCESSED": return "success";    // green
    case "PENDING": return "default";      // grey
    case "COMPLETED": return "success";    // green
    case "PAID": return "success";         // green
    default: return "default";
  }
};

export const getStatusLabel = (status) => {
  return status ? status.charAt(0) + status.slice(1).toLowerCase() : "";
};

export const isPaymentMethodRequired = (method) => {
  // CHQ (Cheque) requires reference number
  // ETRF (ETransfer) might require reference
  return ["CHQ", "ETRF"].includes(method);
};

export const sortBatches = (batches, sortBy = "date", order = "desc") => {
  const sorted = [...batches].sort((a, b) => {
    switch (sortBy) {
      case "date":
        const dateA = new Date(a.createdAt || a.dateCreated);
        const dateB = new Date(b.createdAt || b.dateCreated);
        return order === "desc" ? dateB - dateA : dateA - dateB;
      case "total":
        const totalA = a.totalAmount || 0;
        const totalB = b.totalAmount || 0;
        return order === "desc" ? totalB - totalA : totalA - totalB;
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });
  return sorted;
};
