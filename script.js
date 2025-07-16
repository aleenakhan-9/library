let rawData = [];

function populateDropdown(id, values) {
  const select = document.getElementById(id);
  const unique = [...new Set(values.filter(Boolean))].sort();
  unique.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
  $(`#${id}`).select2({
    placeholder: `Select...`,
    allowClear: true,
    width: 'resolve'
  });
}

function applyFilters() {
  const years = $('#yearFilter').val() || [];
  const locs = $('#locationFilter').val() || [];
  const types = $('#typeFilter').val() || [];
  const access = $('#accessFilter').val() || [];
  const focus = $('#focusFilter').val() || [];
  const actors = $('#actorFilter').val() || [];
  const textSearch = $('#pdfSearch').val().toLowerCase();

  const filtered = rawData.filter(item => {
    return (
      (years.length === 0 || years.includes(item["Year"])) &&
      (locs.length === 0 || locs.includes(item["Location"])) &&
      (types.length === 0 || types.includes(item["Document Type"])) &&
      (access.length === 0 || access.includes(item["Access"])) &&
      (focus.length === 0 || focus.includes(item["Focus Area"])) &&
      (actors.length === 0 || actors.includes(item["Actors"])) &&
      (!textSearch || (item["pdfText"] || "").toLowerCase().includes(textSearch))
    );
  });

  renderTable(filtered);
}

function renderTable(data) {
  const tableBody = document.querySelector("#alertsTable tbody");
  tableBody.innerHTML = "";

  data.forEach(item => {
    const rawDate = item["Date (YYYY-MM-DD)"];
    let formattedDate = "";
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed)) {
        formattedDate = parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      } else {
        formattedDate = rawDate;
      }
    }

    const title = `
      <strong>${item['Title']}</strong><br/>
      <span class='access-tag'>${item['Access']}</span><br/>
      ${item['Description'] || ""}
    `;
    const type = item['Document Type'];
    const location = item['Location'];
    const download = item['Download [Internal]']
      ? `<a href="${item['Download [Internal]']}" class="download-btn" target="_blank">Download</a>`
      : '';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formattedDate}</td>
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

  $('#alertsTable').DataTable({
    pageLength: 15,
    order: [[0, 'desc']], // sort by date descending
    dom: 'lrtip' // hide built-in search bar
  });
}

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    rawData = data;
    populateDropdown("yearFilter", data.map(d => d["Year"]));
    populateDropdown("locationFilter", data.map(d => d["Location"]));
    populateDropdown("typeFilter", data.map(d => d["Document Type"]));
    populateDropdown("accessFilter", data.map(d => d["Access"]));
    populateDropdown("focusFilter", data.map(d => d["Focus Area"]));
    populateDropdown("actorFilter", data.map(d => d["Actors"]));
    renderTable(rawData);
  });

$(document).ready(() => {
  $(".filters select").on("change", applyFilters);
  $("#pdfSearch").on("keyup", applyFilters);
});
