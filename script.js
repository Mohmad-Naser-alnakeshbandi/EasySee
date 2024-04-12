let csvRawData = '';
let csvSeparator = '';

function loadCSV() {
    const input = document.getElementById('csvFileInput');
    const file = input.files[0];
    csvSeparator = document.getElementById('separatorInput').value || ',';

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            csvRawData = e.target.result; // Store raw data globally
            const data = csvToArray(csvRawData, csvSeparator);
            displayTable(data);
        };
        reader.readAsText(file);
    } else {
        alert('Please select a CSV file.');
    }
}

function csvToArray(str, delimiter = ",") {
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");
    return rows.map(function (row) {
        const values = row.split(delimiter);
        return headers.reduce(function (object, header, index) {
            object[header] = values[index];
            return object;
        }, {});
    });
}

function displayTable(data) {
    const table = document.getElementById('csvTable');
    table.innerHTML = "";  // Clear previous table content
    if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const header = document.createElement('th');
            header.textContent = headerText;
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);

        data.forEach(row => {
            const rowElement = document.createElement('tr');
            headers.forEach(header => {
                const cell = document.createElement('td');
                cell.textContent = row[header] || ''; 
                rowElement.appendChild(cell);
            });
            table.appendChild(rowElement);
        });
    } else {
        table.innerHTML = "<tr><td>No data to display</td></tr>";
    }
}

function applyQuery() {
    const query = document.getElementById('sqlQueryInput').value;
    const data = csvToArray(csvRawData, csvSeparator); // Re-parse CSV data

    if (query) {
        const filteredData = data.filter(row => evaluateQuery(row, query));
        displayTable(filteredData);
    } else {
        displayTable(data); // Display all data if query is empty
    }
}

function evaluateQuery(row, query) {
    const normalize = str => str.replace(/\s+/g, ' ').trim();
    query = normalize(query);

    // Basic tokenization for logical operators
    const evalOr = query.split(' OR ').map(cond => evalAnd(cond, row));
    return evalOr.includes(true);
}

function evalAnd(cond, row) {
    const evalAnd = cond.split(' AND ').map(subCond => evalNot(subCond, row));
    return evalAnd.includes(false) ? false : true;
}

function evalNot(cond, row) {
    if (cond.trim().startsWith('NOT ')) {
        const statement = cond.trim().substring(4);
        return !evalCondition(statement, row);
    } else {
        return evalCondition(cond, row);
    }
}

function evalCondition(cond, row) {
    let [column, operator, ...values] = cond.split(' ');
    const value = values.join(' '); // To handle spaces within values

    if (!row.hasOwnProperty(column)) return false;

    switch (operator) {
        case '>':
            return parseFloat(row[column]) > parseFloat(value);
        case '<':
            return parseFloat(row[column]) < parseFloat(value);
        case '=':
            return row[column] == value;
        case '!=':
            return row[column] != value;
        default:
            return false; // Unsupported operator
    }
}
