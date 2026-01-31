/**
 * Utility functions for exporting data to CSV and PDF formats
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column names to include (optional, defaults to all object keys)
 * @returns {string} CSV formatted string
 */
export const convertToCSV = (data, columns = null) => {
  if (!data || data.length === 0) {
    return "";
  }

  // Get column headers
  const headers = columns || Object.keys(data[0]);

  // Create CSV header row
  const csvHeaders = headers
    .map(header => `"${String(header).replace(/"/g, '""')}"`)
    .join(",");

  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '""';
        }
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
};

/**
 * Download CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file to download
 * @param {Array} columns - Array of column names to include (optional)
 */
export const downloadCSV = (data, filename = "export.csv", columns = null) => {
  const csv = convertToCSV(data, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Download PDF file using jsPDF
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file to download
 * @param {string} title - Title for the PDF
 * @param {Array} columns - Array of column names to include (optional)
 */
export const downloadPDF = async (data, filename = "export.pdf", title = "Data Export", columns = null) => {
  try {
    // Dynamically import jsPDF and autoTable
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: "center" });

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: "center" });

    if (!data || data.length === 0) {
      doc.text("No data to export", 14, 35);
      doc.save(filename);
      return;
    }

    // Prepare table data
    const headers = columns || Object.keys(data[0]);
    const tableData = data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return "";
        }
        return String(value);
      })
    );

    // Add table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 30,
      margin: { top: 30 },
      theme: "grid",
      headerStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      bodyStyles: {
        textColor: 0,
      },
    });

    doc.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback to CSV if PDF generation fails
    console.warn("PDF generation failed, falling back to CSV");
    downloadCSV(data, filename.replace(".pdf", ".csv"), columns);
  }
};

/**
 * Format driver data for export
 * @param {Array} drivers - Array of driver objects
 * @returns {Array} Formatted driver data
 */
export const formatDriversForExport = (drivers) => {
  return drivers.map(driver => ({
    "Driver #": driver.driverNumber || "-",
    "First Name": driver.firstName || "-",
    "Last Name": driver.lastName || "-",
    "Full Name": `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || "-",
    "License #": driver.licenseNumber || "-",
    "License Expiry": driver.licenseExpiry || "-",
    "Phone": driver.phone || "-",
    "Email": driver.email || "-",
    "Address": driver.address || "-",
    "Type": driver.isOwner ? "Owner" : "Driver",
    "Status": driver.status || "-",
    "Joined Date": driver.joinedDate || "-",
    "SIN": driver.sin || "-",
    "GST Number": driver.gstNumber || "-",
    "Deposit Amount": driver.depositAmount || "-",
    "Emergency Contact": driver.emergencyContactName || "-",
    "Emergency Phone": driver.emergencyContactPhone || "-",
  }));
};

/**
 * Format cab data for export
 * @param {Array} cabs - Array of cab objects
 * @returns {Array} Formatted cab data
 */
export const formatCabsForExport = (cabs) => {
  return cabs.map(cab => ({
    "Cab #": cab.cabNumber || "-",
    "Registration #": cab.registrationNumber || "-",
    "Year": cab.year || "-",
    "Make": cab.make || "-",
    "Model": cab.model || "-",
    "Color": cab.color || "-",
    "Type": cab.cabType === "HANDICAP_VAN" ? "Handicap Van" : "Sedan",
    "Share Type": cab.shareType ? (cab.shareType === "VOTING_SHARE" ? "Voting" : "Non-Voting") : "-",
    "Shift Type": cab.cabShiftType ? (cab.cabShiftType === "SINGLE" ? "Single" : "Double") : "-",
    "Status": cab.status || "-",
    "Airport Licensed": cab.hasAirportLicense ? "Yes" : "No",
    "Airport License #": cab.airportLicenseNumber || "-",
    "Airport License Expiry": cab.airportLicenseExpiry || "-",
    "Notes": cab.notes || "-",
  }));
};
