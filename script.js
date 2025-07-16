const SHEET_ID = '1OiEVshjY2Dg1ACtVS-Jcp2LXF1qWepb8shAUNlXrOmc';
const SHEET_NAME = 'Full Card Catalog [DO NOT FILTER]';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const scriptURL = 'https://script.google.com/a/macros/princeton.edu/s/AKfycbwW6RsaSUpsdXOX5OGI781JiWd3EGePA_6P6ctfUSQbC86XReS-Lrf9GWfBic3CSA1M/exec'; // Replace with your actual Web App URL
let rawData = [];
function populateDropdown(id, values) {
  const select = $(`#${id}`);
  const uniqueValues = [...new Set(values.filter(Boolean))].sort();
  select.empty();
  uniqueValues.forEach(val => {
    const option = new Option(val, val, false, false);
    select.append(option);
  });
  select.select2({
    placeholder: `Select ${id.replace("Filter", "")}`,
    allowClear: true
  });
}
function applyFilters() {
  const year = $('#yearFilter').val() || [];
  const loc = $('#locationFilter').val() || [];
  const type = $('#typeFilter').val() || [];
  const access = $('#accessFilter').val() || [];
  const focus = $('#focusFilter').val() || [];
  const actors = $('#actorFilter').val() || [];
  const textSearch = $('#pdfSearch').val().toLowerCase();
  const filtered = rawData.filter(item => {
    return (year.length === 0 || year.includes(item["Year"])) &&
           (loc.length === 0 || loc.includes(item["Location"])) &&
           (type.length === 0 || type.includes(item["Document Type"])) &&
           (access.length === 0 || access.includes(item["Access"])) &&
           (focus.length === 0 || focus.includes(item["Focus Area"])) &&
           (actors.length === 0 || actors.includes(item["Actors"])) &&
           (!textSearch || (item["pdfText"] || "").toLowerCase().includes(textSearch));
  });
  renderTable(filtered);
}
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function renderTable(data) {
  const tableBody = document.querySelector("#alertsTable tbody");
  tableBody.innerHTML = "";
  // Sort by most recent date
  data.sort((a, b) => new Date(b["Date (YYYY-MM-DD)"]) - new Date(a["Date (YYYY-MM-DD)"]));
  data.forEach(item => {
    const row = document.createElement("tr");
    const date = formatDate(item["Date (YYYY-MM-DD)"]);
    const title = `
      <strong>${item["Title"]}</strong><br/>
      <span class='access-tag'>${item["Access"]}</span><br/>
      ${item["Description"]}
    `;
    const docType = item["Document Type"] || "";
    const location = item["Location"] || "";
    const download = item["Download [Internal]"]
      ? `<a href="${item["Download [Internal]"]}" class="download-btn" target="_blank">Download</a>`
      : "";
    row.innerHTML = `
      <td>${date}</td>
      <td>${title}</td>
      <td>${docType}</td>
      <td>${location}</td>
      <td>${download}</td>
    `;
    tableBody.appendChild(row);
  });
  if ($.fn.dataTable.isDataTable("#alertsTable")) {
    $('#alertsTable').DataTable().destroy();
  }
  $('#alertsTable').DataTable({
    pageLength: 25,
    order: [[0, 'desc']]
  });
}
$(document).ready(function () {
  $.getJSON(scriptURL, function (data) {
    rawData = data;
    populateDropdown("yearFilter", data.map(d => d["Year"]));
    populateDropdown("locationFilter", data.map(d => d["Location"]));
    populateDropdown("typeFilter", data.map(d => d["Document Type"]));
    populateDropdown("accessFilter", data.map(d => d["Access"]));
    populateDropdown("focusFilter", data.map(d => d["Focus Area"]));
    populateDropdown("actorFilter", data.map(d => d["Actors"]));
    renderTable(data);
  });
  $(".filters select").on("change", applyFilters);
  $("#pdfSearch").on("keyup", applyFilters);
});
