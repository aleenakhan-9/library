const SHEET_ID = '1OiEVshjY2Dg1ACtVS-Jcp2LXF1qWepb8shAUNlXrOmc'; // replace this with your real sheet ID
const SHEET_NAME = 'Full Card Catalog [DO NOT FILTER]';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
let rawData = [];
async function loadData() {
  const response = await fetch(SHEET_URL);
  const text = await response.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));
  const cols = json.table.cols.map(col => col.label);
  const rows = json.table.rows.map(row => {
    let obj = {};
    row.c.forEach((cell, i) => {
      obj[cols[i]] = cell ? cell.v : "";
    });
    return obj;
  });
  rawData = rows;
  populateFilters(rows);
  renderTable(rows);
}
function populateFilters(data) {
  populateDropdown("yearFilter", data.map(d => d["Year"]));
  populateDropdown("locationFilter", data.map(d => d["Location"]));
  populateDropdown("typeFilter", data.map(d => d["Document Type"]));
  populateDropdown("accessFilter", data.map(d => d["Access"]));
  populateDropdown("focusFilter", data.map(d => d["Focus Area"]));
  populateDropdown("actorFilter", data.map(d => d["Actors"]));
}
function populateDropdown(id, values) {
  const select = document.getElementById(id);
  const unique = [...new Set(values.filter(Boolean))].sort();
  unique.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
  $(`#${id}`).select2({ placeholder: `All ${id.replace("Filter", "")}` });
}
function applyFilters() {
  const years = $('#yearFilter').val() || [];
  const locs = $('#locationFilter').val() || [];
  const types = $('#typeFilter').val() || [];
  const access = $('#accessFilter').val() || [];
  const focus = $('#focusFilter').val() || [];
  const actors = $('#actorFilter').val() || [];
  const searchText = $('#pdfSearch').val().toLowerCase();
  const filtered = rawData.filter(item => {
    return (
      (years.length === 0 || years.includes(item["Year"])) &&
      (locs.length === 0 || locs.includes(item["Location"])) &&
      (types.length === 0 || types.includes(item["Document Type"])) &&
      (access.length === 0 || access.includes(item["Access"])) &&
      (focus.length === 0 || focus.includes(item["Focus Area"])) &&
      (actors.length === 0 || actors.includes(item["Actors"])) &&
      (!searchText || (item["pdfText"] || "").toLowerCase().includes(searchText))
    );
  });
  renderTable(filtered);
}
function renderTable(data) {
  const tableBody = document.querySelector("#alertsTable tbody");
  tableBody.innerHTML = "";
  data.forEach(item => {
    const row = document.createElement("tr");
    const dateRaw = item['Date (YYYY-MM-DD)'];
    const date = (typeof dateRaw === "object" && dateRaw.toLocaleDateString)
      ? dateRaw.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : dateRaw;
    const title = `
      <strong>${item['Title']}</strong><br/>
      <span class='access-tag'>${item['Access']}</span><br/>
      ${item['Description']}
    `;
    const type = item['Document Type'];
    const location = item['Location'];
    const download = item['Download [Internal]']
      ? `<a href="${item['Download [Internal]']}" class="download-btn" target="_blank">Download</a>`
      : '';
    row.innerHTML = `
      <td>${date}</td>
      <td>${title}</td>
      <td>${type}</td>
      <td>${location}</td>
      <td>${download}</td>
    `;
    tableBody.appendChild(row);
  });
  if ($.fn.dataTable.isDataTable("#alertsTable")) {
    $('#alertsTable').DataTable().destroy();
  }
  $('#alertsTable').DataTable({ pageLength: 15 });
}
// Event bindings
$(document).ready(() => {
  loadData();
  $(".filters select").on("change", applyFilters);
  $("#pdfSearch").on("keyup", applyFilters);
});
