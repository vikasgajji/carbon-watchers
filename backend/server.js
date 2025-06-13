const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

const excelFile = path.join(__dirname, 'users.xlsx');
let workbook;
if (fs.existsSync(excelFile)) {
    workbook = XLSX.readFile(excelFile);
} else {
    workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, ws, 'Users');
    XLSX.writeFile(workbook, excelFile);
}

function writeToExcel(data) {
    try {
        console.log('Writing to Excel:', data);
        const wsName = 'Users';
        let ws = workbook.Sheets[wsName];
        const wsData = XLSX.utils.sheet_to_json(ws);
        wsData.push({
            Name: data.name,
            Action: data.action,
            CO2_Emissions: data.totalEmissions || '',
            Timestamp: new Date().toISOString()
        });
        ws = XLSX.utils.json_to_sheet(wsData);
        workbook.Sheets[wsName] = ws;
        XLSX.writeFile(workbook, excelFile);
        console.log('Excel updated successfully');
    } catch (err) {
        console.error('Error updating Excel:', err.message);
    }
}

app.post('/submit', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        writeToExcel({ name, action: 'Submit' });
        res.json({ message: 'Submission successful' });
    } catch (err) {
        console.error('Error in /submit:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/calculate', (req, res) => {
    try {
        const { name, totalEmissions } = req.body;
        if (!name || !totalEmissions) {
            return res.status(400).json({ error: 'Name and totalEmissions are required' });
        }
        writeToExcel({ name, action: 'Calculate', totalEmissions });
        res.json({ message: 'Calculation logged successfully' });
    } catch (err) {
        console.error('Error in /calculate:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});