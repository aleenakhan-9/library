const SHEET_ID = '1OiEVshjY2Dg1ACtVS-Jcp2LXF1qWepb8shAUNlXrOmc';
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
  ["year", "location", "type", "access", "focus", "actor"].forEach(id => {
    const keyMap = {
      year: "Year",
      location: "Location",
      type: "Document Type",
      access: "Access",
      focus: "Focus Area",
      actor: "Actors"
    };
    const values = data.map(d => d[keyMap[id]]);
    const select = document.getElementById(`${id}Filter`);
    select.innerHTML = '';
    const unique = [...new Set(values.filter(Boolean))].sort();
    unique.forEach(val => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      select.appendChild(option);
    });
  });

  $(".filters select").select2({ placeholder: "Select..." }).on("change", applyFilters);
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
    const rawDate = new Date(item['Date (YYYY-MM-DD)']);
    const formattedDate = rawDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-order="${item['Date (YYYY-MM-DD)']}">${formattedDate}</td>
      <td><strong>${item['Title']}</strong><br/><span class='access-tag'>${item['Access']}</span><br/>${item['Description']}</td>
      <td>${item['Document Type']}</td>
      <td>${item['Location']}</td>
      <td>${item['Download [Internal]'] ? `<a href="${item['Download [Internal]']}" class="download-btn" target="_blank">Download</a>` : ''}</td>
    `;
    tableBody.appendChild(row);
  });

  if ($.fn.dataTable.isDataTable("#alertsTable")) {
    $('#alertsTable').DataTable().destroy();
  }
  $('#alertsTable').DataTable({
    pageLength: 15,
    order: [[0, 'desc']]
  });
}

$(document).ready(() => {
  loadData();
  $("#pdfSearch").on("keyup", applyFilters);
});
